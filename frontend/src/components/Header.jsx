import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { ensureArcTestnet } from '../utils/networkUtils'

export default function Header() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, status } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const [showConnectors, setShowConnectors] = useState(false)

  // Fetch native balance (USDC on Arc Testnet)
  const { data: balance, refetch: refetchBalance } = useBalance({
    address: address,
    chainId: 5042002, // Arc Testnet
  })

  // Refetch balance periodically
  useEffect(() => {
    if (isConnected && address) {
      const interval = setInterval(() => {
        refetchBalance()
      }, 10000) // Refresh every 10 seconds
      
      return () => clearInterval(interval)
    }
  }, [isConnected, address, refetchBalance])

  const handleConnect = async (connector) => {
    try {
      await connect({ connector })
      setShowConnectors(false)
    } catch (error) {
      console.error('Connection failed:', error)
    }
  }

  // Ensure Arc Testnet after any connection or chain change
  useEffect(() => {
    if (isConnected && chainId) {
      const checkNetwork = async () => {
        try {
          await ensureArcTestnet(chainId)
        } catch (networkError) {
          console.error('Failed to ensure Arc Testnet:', networkError)
        }
      }
      
      // Small delay to ensure wallet state is stable
      const timer = setTimeout(checkNetwork, 500)
      return () => clearTimeout(timer)
    }
  }, [isConnected, chainId])

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Format balance for display
  const formatBalance = () => {
    if (!balance) return '0.00'
    const formatted = formatUnits(balance.value, 18) // USDC has 6 decimals
    return parseFloat(formatted).toFixed(2)
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b-2 border-black z-50">
      <div className="max-w-7xl mx-auto px-2 md:px-6 lg:px-8 py-2 md:py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="text-base md:text-xl font-bold tracking-wider">ARCCLOT</div>
          
          {/* Wallet Controls */}
          <div className="flex items-center space-x-1 md:space-x-4 relative">
            {isConnected ? (
              <>
                {/* Balance Display - Compact on mobile */}
                <div className="flex items-center border-2 border-black px-1.5 md:px-3 py-1 bg-green-50">
                  <span className="text-xs md:text-sm font-bold text-green-700">
                    {formatBalance()}
                  </span>
                </div>
                
                {/* Address Display - Hidden on very small screens, shown on sm+ */}
                <div className="hidden sm:block text-xs md:text-sm font-mono border border-black px-2 md:px-3 py-1 bg-gray-50">
                  {formatAddress(address)}
                </div>
                
                <button
                  onClick={() => disconnect()}
                  className="px-2 md:px-4 py-1.5 md:py-2 border-2 border-black bg-white text-black font-bold hover:bg-gray-100 transition-colors text-xs md:text-sm"
                >
                  <span className="hidden sm:inline">DISCONNECT</span>
                  <span className="sm:hidden">✕</span>
                </button>
              </>
            ) : (
            <div className="relative">
              <button
                onClick={() => setShowConnectors(!showConnectors)}
                disabled={status === 'pending'}
                className="px-2 md:px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors text-xs md:text-sm disabled:bg-gray-600"
              >
                {status === 'pending' ? 'CONNECTING...' : 'CONNECT'}
              </button>
              
              {showConnectors && (
                <div className="absolute top-full right-0 mt-2 bg-white border-2 border-black min-w-40 md:min-w-48 z-50">
                  {connectors.map((connector) => (
                    <button
                      key={connector.uid}
                      onClick={() => handleConnect(connector)}
                      disabled={status === 'pending'}
                      className="w-full p-2 md:p-3 text-left border-b border-black last:border-b-0 hover:bg-gray-100 transition-colors font-bold disabled:bg-gray-200 text-xs md:text-sm"
                    >
                      {connector.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}