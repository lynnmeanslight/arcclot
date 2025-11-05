import { useChainId, useAccount } from 'wagmi'
import { switchToArcTestnet, isArcTestnet } from '../utils/networkUtils'

export default function NetworkStatus() {
  const chainId = useChainId()
  const { isConnected } = useAccount()

  if (!isConnected) return null

  const handleSwitchNetwork = async () => {
    try {
      await switchToArcTestnet()
    } catch (error) {
      console.error('Manual network switch failed:', error)
      alert(`Failed to switch to Arc Testnet: ${error.message}`)
    }
  }

  const isCorrectNetwork = isArcTestnet(chainId)

  if (isCorrectNetwork) {
    return (
      <div className="fixed top-16 right-4 z-40 bg-green-100 border-green-500 border-2 px-3 py-2 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="font-mono">Arc Testnet ✓</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-16 right-4 z-40 bg-red-100 border-red-500 border-2 px-3 py-2 text-xs">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        <span className="font-mono">Wrong Network</span>
        <button
          onClick={handleSwitchNetwork}
          className="bg-black text-white px-2 py-1 text-xs font-bold hover:bg-gray-800"
        >
          FIX
        </button>
      </div>
    </div>
  )
}