# 🎉 Claim Ur Pump Fees! 

**Automated Pump.fun Creator Fee Claimer & Live Dashboard**

A complete solution for automatically claiming and redistributing Pump.fun creator fees to token holders, featuring a beautiful real-time dashboard to track the entire process.

## 🚀 What This Does

Since May 12, 2025, Pump.fun allocates **0.05% of every trade** as creator revenue directly to coin creators' wallets. This project:

1. **🤖 Automatically Claims** accumulated SOL fees from your Pump.fun creator reward vault
2. **💰 Instantly Redistributes** claimed SOL to token holders proportionally based on their holdings
3. **📊 Live Dashboard** shows real-time claiming activity, distributions, and token stats
4. **🎊 Engaging UI** with confetti celebrations, countdown timers, and live blockchain data

## 🏗️ Architecture

### Backend Worker (`/worker`)
- **Node.js/TypeScript** cron job that runs every 10 minutes
- Connects to Solana via RPC and checks creator reward vault balance
- Claims fees when threshold is met using Pump.fun's `claim_creator_rewards` instruction
- Fetches all token holders via Helius DAS API
- Calculates proportional distributions and sends SOL to holders
- Logs all activity to PostgreSQL database
- Exposes REST API for dashboard data

### Frontend Dashboard (`/pump-dashboard`)
- **Next.js/React** with beautiful, playful UI design
- Real-time updates using SWR for data fetching
- Live countdown to next claim cycle
- Confetti animations when new claims are detected
- Direct blockchain queries for unclaimed SOL balance
- Mobile-responsive with dark/light theme support

## 🛠️ Setup & Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Solana RPC endpoint (Helius recommended)
- Pump.fun token creator wallet private key

### Environment Variables

Create `.env` files in both `/worker` and `/pump-dashboard`:

```bash
# Worker Environment
DEV_SECRET=your_wallet_private_key_base58
RPC_URL=https://api.mainnet-beta.solana.com
HELIUS_API_KEY=your_helius_api_key
TOKEN_MINT=your_token_mint_address
CLAIM_PROGRAM_ID=your_claim_program_id
POSTGRES_URL=postgresql://user:pass@host:port/db
CLAIM_THRESHOLD_LAMPORTS=1000000
MIN_FEE_RESERVE_LAMPORTS=5000000
BLACKLIST=comma,separated,addresses,to,exclude
MAX_INSTR=20
MAX_BATCH_TX=500

# Dashboard Environment  
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_TOKEN_MINT=your_token_mint_address
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
```

### Local Development

1. **Start the Worker:**
```bash
cd worker
npm install
npm run build
npm run start:server  # API server
npm run start:cron    # Claim worker
```

2. **Start the Dashboard:**
```bash
cd pump-dashboard
npm install
npm run dev
```

### Production Deployment

**Worker:** Deploy to Railway, Render, or any Node.js hosting platform
**Dashboard:** Deploy to Vercel, Netlify, or similar

## 📱 Dashboard Features

- **🎯 Main Claim Banner**: Shows last claimed amount with animated counting and confetti
- **⏰ Live Countdown**: Real-time countdown to next claim cycle with visual urgency
- **💎 Unclaimed SOL Tracker**: Live blockchain data showing accumulating fees
- **📈 Stats Overview**: Holder count, batch transactions, last run info
- **📋 Transaction Feed**: Recent distributions with recipient details
- **🔗 Quick Links**: Direct links to DexScreener, Twitter, and blockchain explorers

## 🎨 UI Highlights

- **Playful Design**: Cartoonish, bouncy animations with vibrant green theme
- **Real-time Updates**: Live data from blockchain and backend APIs
- **Celebration Effects**: Confetti animations for successful claims
- **Mobile Optimized**: Responsive design that works on all devices
- **Theme Support**: Light and dark mode toggle

## 🔧 Technical Details

### Claim Process
1. Worker derives creator reward vault PDA from token mint
2. Checks SOL balance in vault via RPC
3. If above threshold, executes claim transaction
4. Fetches all token holders via Helius DAS API
5. Calculates proportional shares based on token balances
6. Sends batched SOL transfers to holders
7. Logs all activity to database

### Security Features
- Private keys stored securely in environment variables
- Blacklist support to exclude specific addresses
- Transaction limits to prevent runaway costs
- Minimum fee reserves to ensure operational continuity

## 📊 Database Schema

```sql
-- Stats table for dashboard metrics
CREATE TABLE stats (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Claim logs for transaction history
CREATE TABLE claim_logs (
  sig TEXT PRIMARY KEY,
  json JSONB,
  ts TIMESTAMPTZ DEFAULT NOW()
);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## ⚠️ Disclaimer

This software is experimental and provided as-is. Cryptocurrency transactions are irreversible. Meme tokens carry extreme risk. This is not financial advice.

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for the Pump.fun community**
