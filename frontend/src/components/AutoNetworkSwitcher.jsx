import { useEffect } from 'react'
import { useSwitchChain, useChainId, useAccount } from 'wagmi'
import { arcTestnet } from '../config/wagmi'

export default function AutoNetworkSwitcher() {
  const { switchChain, isPending } = useSwitchChain()
  const chainId = useChainId()
  const { isConnected } = useAccount()

  useEffect(() => {
    if (!isConnected) {
      return
    }

    if (isPending) {
      return
    }

    if (chainId !== arcTestnet.id) {
      try {
        // Use wagmi's switchChain with correct API
        switchChain({ chainId: arcTestnet.id })
      } catch (error) {
        console.error('❌ [AutoNetworkSwitcher] Failed to switch:', error)
      }
    } else {
    }
  }, [isConnected, chainId, switchChain, isPending])

  return null // This component doesn't render anything
}
