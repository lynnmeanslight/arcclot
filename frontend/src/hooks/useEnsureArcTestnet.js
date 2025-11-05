import { useEffect, useState, useCallback } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { ensureArcTestnet, isArcTestnet } from '../utils/networkUtils'

export const useEnsureArcTestnet = () => {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false)
  const [networkError, setNetworkError] = useState(null)

  const checkAndSwitchNetwork = useCallback(async () => {
    if (!isConnected || !chainId) {
      return
    }

    if (!isArcTestnet(chainId)) {
      setIsCheckingNetwork(true)
      setNetworkError(null)
      
      try {
        await ensureArcTestnet(chainId)
        setNetworkError(null)
      } catch (error) {
        console.error('Network switch failed in hook:', error)
        setNetworkError(error.message || 'Failed to switch to Arc Testnet')
      } finally {
        setIsCheckingNetwork(false)
      }
    }
  }, [isConnected, chainId])

  // Immediate check on connection or chain change
  useEffect(() => {
    if (isConnected && chainId) {
      checkAndSwitchNetwork()
    }
  }, [isConnected, chainId, checkAndSwitchNetwork])

  // More aggressive listening for chain changes
  useEffect(() => {
    const handleChainChanged = (newChainId) => {
      setTimeout(() => {
        checkAndSwitchNetwork()
      }, 100)
    }

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setTimeout(() => {
          checkAndSwitchNetwork()
        }, 500)
      }
    }

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged)
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged)
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [checkAndSwitchNetwork])

  return {
    isCorrectNetwork: isConnected ? isArcTestnet(chainId) : false,
    isCheckingNetwork,
    networkError,
    switchNetwork: checkAndSwitchNetwork,
  }
}