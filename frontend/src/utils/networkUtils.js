import { arcTestnet } from '../config/wagmi'

// Add Arc Testnet to wallet
export const addArcTestnetToWallet = async () => {
  if (!window.ethereum) {
    throw new Error('No wallet detected')
  }

  const chainIdHex = `0x${arcTestnet.id.toString(16)}`

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: chainIdHex,
          chainName: arcTestnet.name,
          rpcUrls: [arcTestnet.rpcUrls.default.http[0]],
          nativeCurrency: {
            name: arcTestnet.nativeCurrency.name,
            symbol: arcTestnet.nativeCurrency.symbol,
            decimals: arcTestnet.nativeCurrency.decimals,
          },
          blockExplorerUrls: [arcTestnet.blockExplorers.default.url],
        },
      ],
    })
    return true
  } catch (error) {
    console.error('Failed to add Arc Testnet:', error)
    throw error
  }
}

// Switch to Arc Testnet
export const switchToArcTestnet = async () => {
  if (!window.ethereum) {
    throw new Error('No wallet detected')
  }

  const chainIdHex = `0x${arcTestnet.id.toString(16)}`

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })
    return true
  } catch (error) {
    // If network doesn't exist, add it first
    if (error.code === 4902 || error.code === -32603 || error.message?.includes('Unrecognized chain ID')) {
      await addArcTestnetToWallet()
      // Try switching again after adding
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      })
      return true
    }
    console.error('Failed to switch to Arc Testnet:', error)
    throw error
  }
}

// Check if current network is Arc Testnet
export const isArcTestnet = (chainId) => {
  return chainId === arcTestnet.id
}

// Auto-add and switch to Arc Testnet if needed
export const ensureArcTestnet = async (currentChainId) => {
  if (!window.ethereum) {
    throw new Error('No wallet detected')
  }

  if (!isArcTestnet(currentChainId)) {
    try {
      await switchToArcTestnet()
    } catch (error) {
      // If switch fails for any reason, try adding the network first
      if (error.code === 4902 || error.code === -32603 || error.message?.includes('Unrecognized chain ID')) {
        try {
          await addArcTestnetToWallet()
          await switchToArcTestnet()
        } catch (addError) {
          throw new Error(`Failed to add or switch to Arc Testnet: ${addError.message}`)
        }
      } else {
        throw new Error(`Failed to switch to Arc Testnet: ${error.message}`)
      }
    }
  }
  
  return true
}