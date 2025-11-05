import { useConnect, useDisconnect } from 'wagmi'
import { ensureArcTestnet } from '../utils/networkUtils'

export default function WalletConnect() {
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = async (connector) => {
    try {
      await connect({ connector })
      // After connection, ensure we're on Arc Testnet
      setTimeout(async () => {
        try {
          const chainId = await window.ethereum?.request({ method: 'eth_chainId' })
          const currentChainId = parseInt(chainId, 16)
          await ensureArcTestnet(currentChainId)
        } catch (networkError) {
          console.error('Failed to ensure Arc Testnet after connection:', networkError)
        }
      }, 1000) // Small delay to ensure connection is complete
    } catch (connectError) {
      console.error('Connection failed:', connectError)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-8 pt-20">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-black mb-4 tracking-wider">ARCCLOT</h1>
        <div className="w-24 md:w-32 h-px bg-black mx-auto mb-8"></div>

        <div className="border-4 border-black bg-white p-8 w-full max-w-md">
          <div className="space-y-4">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => handleConnect(connector)}
                disabled={status === 'pending'}
                className="w-full p-4 border-2 border-black bg-white hover:bg-gray-100 font-bold transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                {connector.name}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 border-2 border-black bg-gray-100 text-center text-sm">
              ERROR: {error.message}
            </div>
          )}

          {status === 'pending' && (
            <div className="mt-4 p-3 border-2 border-black bg-gray-100 text-center text-sm">
              CONNECTING...
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Make sure you're connected to Arc Testnet</p>
          <p>Network will be added automatically if needed</p>
        </div>
      </div>
    </div>
  )
}