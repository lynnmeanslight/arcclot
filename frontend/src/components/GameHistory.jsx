import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWatchContractEvent } from 'wagmi'
import { formatUnits } from 'viem'
import { ARCLOT_CONTRACT } from '../contracts/ArcClot'

const SYMBOLS = ['■', '●', '▲', '◆', '★', '♦', '▼']

export default function GameHistory() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [history, setHistory] = useState([])
  const [playerStats, setPlayerStats] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const fetchHistory = async () => {
    if (!isConnected || !address || !publicClient) return

    setIsLoading(true)
    try {
      // Fetch player stats from contract
      try {
        const stats = await publicClient.readContract({
          address: ARCLOT_CONTRACT.address,
          abi: ARCLOT_CONTRACT.abi,
          functionName: 'playerStats',
          args: [address]
        })

        // Format player stats - handle both array and object responses
        // Note: lastResult was removed from contract, now only 5 values
        const totalSpins = stats.totalSpins !== undefined ? Number(stats.totalSpins) : Number(stats[0])
        const totalWins = stats.totalWins !== undefined ? Number(stats.totalWins) : Number(stats[1])
        const totalPayout = stats.totalPayout !== undefined ? stats.totalPayout : stats[2]
        const lastPayout = stats.lastPayout !== undefined ? stats.lastPayout : stats[3]
        const totalBetAmount = stats.totalBetAmount !== undefined ? stats.totalBetAmount : stats[4]

        setPlayerStats({
          totalSpins,
          totalWins,
          totalPayout,
          lastPayout,
          totalBetAmount
        })
      } catch (statsError) {
        console.error('Error fetching player stats:', statsError)
        // If player stats fetch fails, continue with event history
        setPlayerStats(null)
      }

      // Get Spin events for the connected user
      const logs = await publicClient.getLogs({
        address: ARCLOT_CONTRACT.address,
        event: {
          type: 'event',
          name: 'Spin',
          inputs: [
            { name: 'player', type: 'address', indexed: true },
            { name: 'result', type: 'uint8[3]', indexed: false },
            { name: 'bet', type: 'uint256', indexed: false },
            { name: 'payout', type: 'uint256', indexed: false }
          ]
        },
        args: {
          player: address
        },
      })

      // Parse and format the logs
      const formattedHistory = logs.map((log, index) => ({
        id: index,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        result: log.args.result,
        bet: log.args.bet,
        payout: log.args.payout,
        timestamp: new Date().toISOString() // In a real app, you'd fetch block timestamp
      })).reverse() // Show newest first

      setHistory(formattedHistory)
    } catch (error) {
      console.error('Failed to fetch game history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (showHistory && isConnected) {
      fetchHistory()
    }
  }, [showHistory, isConnected, address])

  // Listen to Spin events for the current user
  useWatchContractEvent({
    address: ARCLOT_CONTRACT.address,
    abi: ARCLOT_CONTRACT.abi,
    eventName: 'Spin',
    onLogs(logs) {
      // Check if any log is for the current user
      const userLog = logs.find(log => 
        log.args.player?.toLowerCase() === address?.toLowerCase()
      )
      if (userLog && showHistory) {
        console.log('Spin event detected for user, refreshing history...')
        fetchHistory()
      }
    },
    enabled: isConnected && !!address && showHistory,
  })

  const formatTxHash = (hash) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  const getResultType = (result, payout) => {
    if (payout === 0n) return 'LOSS'

    const [r1, r2, r3] = result.map(Number)
    if (r1 === r2 && r2 === r3) return '3 OF A KIND'
    if (r1 === r2 || r2 === r3 || r1 === r3) return '2 OF A KIND'
    return 'WIN'
  }

  if (!isConnected) return null

  return (
    <div className="w-full max-w-2xl">
      {/* Toggle Button */}
      <div className="text-center mb-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 md:px-6 py-2 md:py-3 border-2 border-black bg-white text-black font-bold hover:bg-gray-100 transition-colors text-sm md:text-base"
        >
          {showHistory ? 'HIDE HISTORY' : 'SHOW HISTORY'}
        </button>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="border-4 border-black bg-white">
          {/* Header */}
          <div className="border-b-2 border-black p-3 md:p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg md:text-xl font-bold">GAME HISTORY</h3>
              <button
                onClick={fetchHistory}
                disabled={isLoading}
                className="px-2 md:px-3 py-1 text-xs md:text-sm border border-black hover:bg-gray-100 disabled:bg-gray-200"
              >
                {isLoading ? 'LOADING...' : 'REFRESH'}
              </button>
            </div>
          </div>

          {/* Player Stats Summary */}
          {playerStats && playerStats.totalSpins > 0 && (
            <div className="border-b-2 border-black p-3 md:p-4 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-xs md:text-sm">
                <div className="text-center">
                  <div className="font-bold text-lg md:text-2xl">{playerStats.totalSpins}</div>
                  <div className="text-gray-600">Total Spins</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg md:text-2xl">{playerStats.totalWins}</div>
                  <div className="text-gray-600">Total Wins</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg md:text-2xl">
                    {parseFloat(formatUnits(playerStats.totalBetAmount)).toFixed(2)}
                  </div>
                  <div className="text-gray-600">Total Bet (USDC)</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg md:text-2xl">
                    {parseFloat(formatUnits(playerStats.totalPayout, 18)).toFixed(2)}
                  </div>
                  <div className="text-gray-600">Total Won (USDC)</div>
                </div>
              </div>

              {/* Last Game Payout */}
              {playerStats.lastPayout > 0n && (
                <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-300">
                  <div className="text-center">
                    <div className="text-xs md:text-sm text-gray-600 mb-1">LAST GAME PAYOUT</div>
                    <div className="text-lg md:text-xl font-bold">
                      {parseFloat(formatUnits(playerStats.lastPayout, 18)).toFixed(2)} USDC
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

 

          {history.length > 0 && (
            <div className="border-t-2 border-black p-3 md:p-4 bg-gray-50">
              <div className="text-xs md:text-sm text-center">
                <span className="font-bold">{history.length}</span> games played • {' '}
                <span className="font-bold">
                  {history.filter(g => g.payout > 0n).length}
                </span> wins • {' '}
                <span className="font-bold">
                  {history.length > 0 ? (history.filter(g => g.payout > 0n).length / history.length * 100).toFixed(1) : 0}%
                </span> win rate
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}