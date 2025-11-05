# ArcLot DApp

A minimalist black and white slot machine dapp built for Arc Testnet.

## Features

- **Minimalist Design**: Pure black and white interface using Tailwind CSS
- **Web3 Integration**: Connect with MetaMask and other wallets
- **Real-time Stats**: Track your spins, wins, and profits
- **Arc Testnet**: Built specifically for Arc Testnet with USDC betting

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Contract Integration

Update the contract address in `src/contracts/ArcLot.js` after deploying the ArcLot contract:

```javascript
export const ARCLOT_CONTRACT = {
  address: '0xYourContractAddress', // Replace with deployed contract address
  abi: [...]
}
```

## Game Rules

- **Minimum Bet**: 0.5 USDC
- **3 of a Kind**: 5x payout
- **2 of a Kind**: 2x payout  
- **No Match**: No payout

## Network

Make sure your wallet is connected to Arc Testnet:
- **Chain ID**: 5042002
- **RPC URL**: https://rpc.testnet.arc.network
- **Explorer**: https://testnet.arcscan.app/
- **Native Currency**: USDC (6 decimals)

## Design Philosophy

This dapp follows a strict minimalist design:
- Only black and white colors
- Monospace typography
- Clean geometric shapes
- No gradients or fancy animations
- Focus on functionality over decoration