import { Buffer } from 'buffer';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { SendTransactionError } from '@solana/web3.js';
import { Pool } from 'pg';

interface Recipient {
  addr: string;
  pct: number;
}

// Helper type for token holders
type Holder = { owner: string; balance: bigint };

// Build the claim_creator_rewards instruction using known accounts and instruction byte
function buildClaimIx(env: Record<string, string>, payerPubkey: PublicKey): TransactionInstruction {
  const programId = new PublicKey(env.CLAIM_PROGRAM_ID);
  // Derive the creator vault PDA using the creator's pubkey (per IDL)
  const [creatorVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator-vault"), payerPubkey.toBuffer()],
    programId
  );
  // Derive the event authority PDA
  const [eventAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("__event_authority")],
    programId
  );
  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: payerPubkey, isSigner: true, isWritable: true },   // creator
      { pubkey: creatorVault, isSigner: false, isWritable: true }, // creatorVault
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // systemProgram
      { pubkey: eventAuthority, isSigner: false, isWritable: false }, // eventAuthority
      { pubkey: programId, isSigner: false, isWritable: false },      // program
    ],
    // Discriminator for 'collectCreatorFee' from IDL: [20,22,86,123,198,28,219,132]
    data: Buffer.from([20, 22, 86, 123, 198, 28, 219, 132]),
  });
}

// Logging helpers
function log(level: string, msg: string) {
  console.log(`${new Date().toISOString()} [PumpWorker] ${level}: ${msg}`);
}
function info(msg: string) { log('INFO', msg); }
function debug(msg: string) { log('DEBUG', msg); }
function errorLog(msg: string) { console.error(`${new Date().toISOString()} [PumpWorker] ERROR: ${msg}`); }

// Safety limits to prevent run-away resource usage
const MAX_DAS_PAGES = 100;   // ≈100,000 token accounts (1k per page)
const MAX_BATCH_TX   = 500;  // cap number of disbursement transactions per run

// ---------- Simple Postgres helpers -----------
const pgUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
let pgPool: Pool | null = null;
export function getPool(): Pool | null {
  if (!pgUrl) return null;
  if (!pgPool) pgPool = new Pool({ connectionString: pgUrl, max: 2 });
  return pgPool;
}

async function pgInit() {
  const pool = getPool();
  if (!pool) return;
  await pool.query(`create table if not exists stats(key text primary key, value text);
                    create table if not exists claim_logs(sig text primary key, json jsonb, ts timestamptz default now());`);
}

async function getStat(key: string): Promise<string | null> {
  const pool = getPool();
  if (!pool) return null;
  const res = await pool.query('select value from stats where key=$1', [key]);
  return res.rows[0]?.value ?? null;
}

async function putStat(key: string, value: string) {
  const pool = getPool();
  if (!pool) return;
  await pool.query('insert into stats(key,value) values($1,$2) on conflict(key) do update set value=excluded.value', [key, value]);
}

async function logClaim(sig: string, obj: any) {
  const pool = getPool();
  if (!pool) {
    console.log('LOG', sig, obj);
    return;
  }
  await pool.query('insert into claim_logs(sig,json) values($1,$2::jsonb) on conflict do nothing', [sig, JSON.stringify(obj)]);
}

// Fetch holders via Helius JSON-RPC DAS endpoint
async function fetchHolders(mint: string, apiKey: string): Promise<{ holders: Holder[]; pages: number }> {
  const holders: Holder[] = [];
  let page = 1;
  const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
  while (true) {
    info(`Fetching token holders page ${page}`);
    const body = {
      jsonrpc: '2.0', id: 'holder-scan', method: 'getTokenAccounts',
      params: { mint: mint, page: page, limit: 1000 }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Helius DAS ${res.status} ${txt}`);
    }
    const json = await res.json() as { result: { token_accounts: { owner: string; amount: string }[] } };
    const accounts = json.result.token_accounts;
    if (accounts.length === 0) break;
    for (const acct of accounts) holders.push({ owner: acct.owner, balance: BigInt(acct.amount) });
    page++;
    if (page > MAX_DAS_PAGES) {
      info(`Reached MAX_DAS_PAGES (${MAX_DAS_PAGES}), stopping holder fetch early`);
      break;
    }
  }
  return { holders, pages: page - 1 };
}

// ---------------- Utility: dynamic priority fee ----------------
async function getDynamicPriorityFee(connection: Connection): Promise<number> {
  try {
    // getRecentPrioritizationFees requires a list of accounts; use empty for all.
    // types show returning array of {prioritizationFee} lamports
    // We'll fetch last 20 slots fees and pick 75th percentile.
    //   Using undocumented method for now.
    // fallback constant if fails.
    // @ts-ignore – not typed in older web3.js
    const fees = await connection.getRecentPrioritizationFees({});
    const list: number[] = fees.map((f: any) => Number(f.prioritizationFee));
    if (list.length === 0) return 20;
    list.sort((a, b) => a - b);
    const idx = Math.floor(list.length * 0.75);
    const fee = list[idx] || list[list.length - 1];
    return Math.min(Math.max(fee + 1, 5), 100); // clamp 5-100
  } catch (e) {
    return 20; // fallback
  }
}

// helper to prepend compute budget instructions
async function buildTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: Keypair
): Promise<Transaction> {
  const tx = new Transaction();
  const microLamports = await getDynamicPriorityFee(connection);
  // Add price first
  tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports }));

  // simulate to get cu usage
  const simTx = new Transaction();
  simTx.add(...instructions);
  let cu = 200000;
  try {
    const simRes = await connection.simulateTransaction(simTx);
    cu = simRes.value.unitsConsumed ?? 200000;
  } catch {}
  const limit = cu + 10000;
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: limit }));

  for (const ix of instructions) tx.add(ix);
  tx.feePayer = payer.publicKey;
  return tx;
}

// Safety limits remain

// inside sendTransactionWithRetry modify to accept prebuilt tx, microLamports no longer here
async function sendTransactionWithRetry(
  connection: Connection,
  tx: Transaction,
  signers: Keypair[]
): Promise<string> {
  const sig = await connection.sendTransaction(tx, signers);
  return sig; // skip confirm polling
}

// ---------------- Main entry ----------------
async function main() {
  await pgInit();
  const env = process.env as Record<string, string>;
  try {
    await handleScheduled(env);
  } catch (err) {
    console.error('Job failed', err);
    process.exitCode = 1;
  } finally {
    // do not end pool here; separate service handles its own pool
  }
}

if (require.main === module) {
  main();
}

// ---------------- Core logic ----------------
async function handleScheduled(env: Record<string, string>) {
  info('Scheduled job start');
  const rpcUrl = env.RPC_URL;
  const backupRpcUrl = env.BACKUP_RPC_URL;
  const connection = new Connection(rpcUrl || backupRpcUrl, { commitment: 'confirmed' });

  // Load payer keypair
  const secretKey = bs58.decode(env.DEV_SECRET);
  const payer = Keypair.fromSecretKey(secretKey);

  // Derive reward vault PDA and check unclaimed
  const programId = new PublicKey(env.CLAIM_PROGRAM_ID);
  const [rewardVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator_reward_vault"), new PublicKey(env.TOKEN_MINT).toBuffer()], programId
  );
  const unclaimed = await connection.getBalance(rewardVault, 'confirmed');
  // Threshold guard
  const claimThreshold = env.CLAIM_THRESHOLD_LAMPORTS ? BigInt(env.CLAIM_THRESHOLD_LAMPORTS) : BigInt(0);
  info(`Unclaimed lamports: ${unclaimed}, threshold: ${claimThreshold}`);
  if (BigInt(unclaimed) < claimThreshold) {
    info(`Unclaimed below threshold, skipping`);
    // Optionally alert if empty multiple times
    return;
  }

  // right after we fetch balance of reward vault
  if (unclaimed === 0) {
    info('Creator vault empty: nothing to claim this cycle');
  }

  // Snapshot holders
  const { holders: rawHolders, pages: dasPages } = await fetchHolders(env.TOKEN_MINT, env.HELIUS_API_KEY);
  // Deduplicate holders in case DAS pagination returned duplicates
  const holderMap = new Map<string, bigint>();
  for (const h of rawHolders) {
    holderMap.set(h.owner, (holderMap.get(h.owner) ?? BigInt(0)) + h.balance);
  }

  // Apply blacklist from env (comma-separated list of addresses)
  const blacklistRaw = (env.BLACKLIST ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const blacklist = new Set(blacklistRaw.map(s => s.toLowerCase()));
  debug(`Blacklist set contains ${blacklist.size} addresses`);

  debug(`First raw holder addresses: ${rawHolders.slice(0,5).map(h=>h.owner).join(',')}`);

  const holders = Array.from(holderMap.entries())
    .filter(([owner]) => !blacklist.has(owner.toLowerCase()))
    .map(([owner, balance]) => ({ owner, balance }));
  const totalTokens = holders.reduce((sum, h) => sum + h.balance, BigInt(0));
  info(`Fetched ${rawHolders.length} accounts over ${dasPages} pages; unique holders ${holders.length}; total token supply: ${totalTokens}`);
  info(`Blacklist removed ${rawHolders.length - holders.length} accounts`);

  // Metrics counters
  let subRequests = dasPages; // each page fetch is one subrequest
  if (holders.length === 0 || totalTokens === BigInt(0)) {
    info('No holders or zero supply; skipping distribution');
    return;
  }

  // Claim
  const claimIx = buildClaimIx(env, payer.publicKey);
  let claimSig: string;
  try {
    const claimTx = await buildTransaction(connection, [claimIx], payer);
    claimSig = await sendTransactionWithRetry(connection, claimTx, [payer]);
    subRequests += 1; // claim send
    info(`Claim tx: ${claimSig}`);
    // Replay guard
    const prevSig = await getStat('last_claim_sig');
    if (prevSig === claimSig) {
      info('Duplicate claimSig; skipping distribution');
      return;
    }
    await putStat('last_claim_sig', claimSig);
    await putStat('last_claim_ts', Date.now().toString());
    await putStat('last_claim_lamports', unclaimed.toString());
    // Log claim
    await logClaim(claimSig, { type:'claim', ts: Date.now(), lamports: unclaimed });
  } catch (err) {
    errorLog(`Claim failed: ${err}`);
    return;
  }

  // Distribute
  const balanceLamports = BigInt(await connection.getBalance(payer.publicKey, 'confirmed'));
  let feeReserve = BigInt(LAMPORTS_PER_SOL) * BigInt(2) / BigInt(1000);
  const minFeeReserve = env.MIN_FEE_RESERVE_LAMPORTS ? BigInt(env.MIN_FEE_RESERVE_LAMPORTS) : BigInt(5_000_000);
  if (feeReserve < minFeeReserve) {
    info(`Increasing feeReserve from ${feeReserve} to min ${minFeeReserve}`);
    feeReserve = minFeeReserve;
  }
  const distributable = balanceLamports - feeReserve;
  info(`Balance: ${balanceLamports}, feeReserve: ${feeReserve}, distributable: ${distributable}`);
  if (distributable <= BigInt(0)) {
    info(`Dev wallet below fee reserve (needs ${feeReserve - balanceLamports} more lamports); skipping distribution`);
    return;
  }

  // Send in batches
  const MAX_INSTR = 20;
  let tx = new Transaction(); let instrCount = 0; let totalSent = BigInt(0);
  let batch: Holder[] = [];
  let batchesSent = 0;
  info(`Starting distribution to ${holders.length} holders`);
  for (const h of holders) {
    const share = (distributable * h.balance) / totalTokens;
    if (share < BigInt(5000)) continue;
    totalSent += share;
    tx.add(SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: new PublicKey(h.owner), lamports: Number(share) }));
    batch.push({ owner: h.owner, balance: share }); // store share not token balance
    instrCount++;
    if (instrCount >= MAX_INSTR) {
      info(`Sending batch of ${batch.length}`);
      const built = await buildTransaction(connection, tx.instructions, payer);
      const sig = await sendTransactionWithRetry(connection, built, [payer]);
      info(`Batch tx: ${sig}`);
      const safeRecipients = batch.map(h => ({ owner: h.owner, lamportsSent: h.balance.toString() }));
      await logClaim(sig, { type:'disbursement', ts:Date.now(), txSig:sig, recipients: safeRecipients });
      tx = new Transaction(); instrCount = 0; batch = [];
      batchesSent++; subRequests += 1;
      if (batchesSent >= MAX_BATCH_TX) {
        info(`Reached MAX_BATCH_TX (${MAX_BATCH_TX}); remaining holders will be paid next cycle`);
        break;
      }
    }
  }
  if (instrCount > 0) {
    info(`Sending final batch of ${batch.length}`);
    const built = await buildTransaction(connection, tx.instructions, payer);
    const sig = await sendTransactionWithRetry(connection, built, [payer]);
    info(`Final batch tx: ${sig}`);
    const safeRecipients = batch.map(h => ({ owner: h.owner, lamportsSent: h.balance.toString() }));
    await logClaim(sig, { type:'disbursement', ts:Date.now(), txSig:sig, recipients: safeRecipients });
    batchesSent++; subRequests += 1;
  }
  const leftover = distributable - totalSent;
  if (leftover > BigInt(0)) info(`Leftover dev cut: ${leftover}`);

  // Persist metrics for observability (last 24h)
  await putStat('metrics_last_run', JSON.stringify({ ts: Date.now(), holdersProcessed: holders.length, batchesSent, subRequests }));
  info('Scheduled job complete');
} 