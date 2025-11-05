# ArcClot 🎰

The first on-chain slot machine built on Arc Testnet. Play with USDC, compete on the leaderboard, and experience provably fair gaming powered by Circle and Alchemy.

## 🌟 Features

- **On-Chain Gaming**: 100% transparent and verifiable results
- **Real-Time Leaderboard**: Top 100 players tracked on blockchain
- **Instant Payouts**: Automatic USDC rewards
- **Provably Fair**: All outcomes stored on-chain
- **Enhanced Performance**: Powered by Alchemy's RPC infrastructure

## 🏗️ Project Structure

```
arcclot/
├── contract/          # Solidity smart contracts (ArcClot.sol)
└── frontend/          # React + Vite web application
```

## 🚀 Tech Stack

- **Blockchain**: Arc Testnet (EVM-compatible)
- **Native Currency**: USDC (Circle)
- **RPC Provider**: Alchemy
- **Smart Contracts**: Solidity 0.8.30, Foundry
- **Frontend**: React, Vite, Wagmi, TailwindCSS

## 📦 Setup

### Contract

```bash
cd contract
forge install
forge build
forge test
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your contract address and RPC URL
npm run dev
```

## 🔐 Environment Variables

**IMPORTANT**: Never commit `.env` files to git!

### Frontend `.env`
```
VITE_CONTRACT_ADDRESS=<your-deployed-contract-address>
VITE_ARC_TESTNET_RPC_URL=<your-alchemy-rpc-url>
```

## 🎮 How to Play

1. Connect your wallet (MetaMask, WalletConnect, etc.)
2. Switch to Arc Testnet (Chain ID: 5042002)
3. Set your bet amount (minimum 0.5 USDC)
4. Click "SPIN NOW" and watch the reels!
5. Win up to 5x your bet with matching symbols

## 🏆 Leaderboard

The smart contract automatically tracks the top 100 players by net earnings. Rankings update in real-time after each spin through blockchain events.

## 🔗 Links

- **Live App**: [your-deployment-url]
- **Contract Explorer**: [Arc Testnet Scanner]
- **Arc Network**: https://arc.network
- **Circle USDC**: https://circle.com

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Built by **lynnthelight**
- Twitter/X: [@lynnthelight](https://x.com/lynnthelight)

---

**⚠️ Disclaimer**: This is a testnet application for demonstration purposes. Not audited for production use.
