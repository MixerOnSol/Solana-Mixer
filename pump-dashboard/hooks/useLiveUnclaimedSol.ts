'use client';

import useSWR from 'swr';
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  FindProgramAddressResponse,
} from '@solana/web3.js';
import { Buffer } from 'buffer'; // Ensure Buffer is available, might need polyfill for browser

// Ensure environment variables are properly typed or handled if missing
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
const tokenMintStr = process.env.NEXT_PUBLIC_TOKEN_MINT;
const claimProgramIdStr = process.env.NEXT_PUBLIC_CLAIM_PROGRAM_ID;

let connection: Connection | null = null;
if (rpcUrl) {
  connection = new Connection(rpcUrl, 'confirmed');
}

const getCreatorVaultPDA = async (): Promise<FindProgramAddressResponse | null> => {
  if (!tokenMintStr || !claimProgramIdStr) {
    console.error('Token Mint or Claim Program ID is not configured for live unclaimed SOL.');
    return null;
  }
  try {
    const tokenMint = new PublicKey(tokenMintStr);
    const claimProgramId = new PublicKey(claimProgramIdStr);
    // PDA derivation logic matching your worker
    return PublicKey.findProgramAddressSync(
      [Buffer.from('creator_reward_vault'), tokenMint.toBuffer()],
      claimProgramId
    );
  } catch (error) {
    console.error('Error deriving creator vault PDA:', error);
    return null;
  }
};

const fetchLiveUnclaimedSol = async (): Promise<number | null> => {
  if (!connection) {
    console.error('RPC Connection not established for live unclaimed SOL.');
    return null;
  }
  const pdaInfo = await getCreatorVaultPDA();
  if (!pdaInfo) return null;

  const [creatorVaultPublicKey] = pdaInfo;

  try {
    const balanceLamports = await connection.getBalance(creatorVaultPublicKey);
    return balanceLamports / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error fetching live unclaimed SOL:', error);
    // Return null or a specific error code/object if needed
    return null;
  }
};

export function useLiveUnclaimedSol() {
  const { data, error, isLoading } = useSWR(
    (tokenMintStr && claimProgramIdStr && connection) ? 'liveUnclaimedSol' : null, // SWR key, only fetch if params are available
    fetchLiveUnclaimedSol,
    {
      refreshInterval: 20000, // Fetch every 20 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    liveUnclaimedSol: data,
    isLoadingLiveUnclaimed: isLoading,
    errorLiveUnclaimed: error,
  };
} 