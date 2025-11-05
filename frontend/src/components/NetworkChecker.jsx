import { useEffect } from 'react'
import { useEnsureArcTestnet } from '../hooks/useEnsureArcTestnet'
import { switchToArcTestnet } from '../utils/networkUtils'

export default function NetworkChecker({ children }) {
  const { isCorrectNetwork, isCheckingNetwork, networkError, switchNetwork } = useEnsureArcTestnet()

  const handleManualSwitch = async () => {
    try {
      await switchToArcTestnet()
      // Force a re-check after manual switch
      setTimeout(() => {
        switchNetwork()
      }, 1000)
    } catch (error) {
      console.error('Manual switch failed:', error)
    }
  }

  // Automatically retry failed switches after a delay
  useEffect(() => {
    if (networkError && !isCheckingNetwork) {
      const retryTimer = setTimeout(() => {
        switchNetwork()
      }, 5000) // Retry after 5 seconds

      return () => clearTimeout(retryTimer)
    }
  }, [networkError, isCheckingNetwork, switchNetwork])

  // Show loading state while checking/switching network
  if (isCheckingNetwork) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-8 pt-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-4 tracking-wider">ARCLOT</h1>
          <div className="w-24 md:w-32 h-px bg-black mx-auto mb-8"></div>
          <div className="border-4 border-black bg-white p-6 md:p-8">
            <div className="text-lg font-bold mb-4">SWITCHING TO ARC TESTNET...</div>
            <div className="animate-pulse text-sm">Please approve in your wallet</div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state if network switch failed
  if (!isCorrectNetwork && networkError) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-8 pt-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-4 tracking-wider">ARCCLOT</h1>
          <div className="w-24 md:w-32 h-px bg-black mx-auto mb-8"></div>
          <div className="border-4 border-black bg-white p-6 md:p-8 max-w-md">
            <div className="text-lg font-bold mb-4">NETWORK ERROR</div>
            <div className="text-sm mb-6 text-gray-600">
              {networkError}
            </div>
            <button
              onClick={handleManualSwitch}
              className="w-full px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors mb-4 text-sm md:text-base"
            >
              SWITCH TO ARC TESTNET
            </button>
            <button
              onClick={switchNetwork}
              className="w-full px-6 py-3 border-2 border-black bg-white text-black font-bold hover:bg-gray-100 transition-colors text-sm md:text-base"
            >
              RETRY AUTO-SWITCH
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show network prompt if not on correct network (without error)
  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-8 pt-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-4 tracking-wider">ARCCLOT</h1>
          <div className="w-24 md:w-32 h-px bg-black mx-auto mb-8"></div>
          <div className="border-4 border-black bg-white p-6 md:p-8 mb-6">
            <div className="text-lg font-bold mb-4">⚠️ UNSUPPORTED NETWORK</div>
            <div className="text-sm mb-6 text-gray-600">
              Please switch to Arc Testnet to continue
            </div>
            <button
              onClick={handleManualSwitch}
              className="w-full px-6 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors text-sm md:text-base"
            >
              SWITCH TO ARC TESTNET
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render children if on correct network
  return children
}