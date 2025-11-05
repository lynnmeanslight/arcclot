import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'
import { injected, walletConnect } from 'wagmi/connectors'
import { mainnet, sepolia } from 'wagmi/chains'

// Get RPC URL from environment variable with fallback
const ARC_RPC_URL = import.meta.env.VITE_ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network'

// Arc Testnet configuration
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: [ARC_RPC_URL],
    },
    public: {
      http: [ARC_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: 'https://testnet.arcscan.app/',
    },
  },
  testnet: true,
})

export const config = createConfig({
  chains: [arcTestnet], // Include other chains for switching
  connectors: [
    injected(),
  ],
  transports: {
    [arcTestnet.id]: http(ARC_RPC_URL),
  },
})