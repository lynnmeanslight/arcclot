import { useState, useEffect } from 'react'
import { usePublicClient, useWatchContractEvent } from 'wagmi'
import { formatUnits } from 'viem'
import { ARCLOT_CONTRACT } from '../contracts/ArcClot'

export default function Leaderboard() {
  const publicClient = usePublicClient()
  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchLeaderboard = async () => {
    if (!publicClient) return

    setIsLoading(true)
    setError(null)
    
    try {
      const data = await publicClient.readContract({
        address: ARCLOT_CONTRACT.address,
        abi: ARCLOT_CONTRACT.abi,
        functionName: 'getLeaderboard',
      })

      // Format the leaderboard data
      const formattedData = data.map((entry, index) => ({
        rank: index + 1,
        address: entry.player,
        earnings: entry.earnings,
        formattedEarnings: parseFloat(formatUnits(entry.earnings, 18)).toFixed(2)
      }))

      setLeaderboard(formattedData)
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError('Failed to load leaderboard')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard()
  }, [publicClient])

  // Listen to LeaderboardUpdated events
  useWatchContractEvent({
    address: ARCLOT_CONTRACT.address,
    abi: ARCLOT_CONTRACT.abi,
    eventName: 'LeaderboardUpdated',
    onLogs(logs) {
      console.log('LeaderboardUpdated event detected, refreshing leaderboard...')
      fetchLeaderboard()
    },
    enabled: !!publicClient,
  })

  // Also listen to Spin events as fallback (in case LeaderboardUpdated is missed)
  useWatchContractEvent({
    address: ARCLOT_CONTRACT.address,
    abi: ARCLOT_CONTRACT.abi,
    eventName: 'Spin',
    onLogs(logs) {
      console.log('Spin event detected, refreshing leaderboard...')
      fetchLeaderboard()
    },
    enabled: !!publicClient,
  })

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getRankEmoji = (rank) => {
    switch(rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `#${rank}`
    }
  }

  return (
    <div className="border-4 border-black bg-white p-4 w-full shadow-lg">
      <div className="flex justify-between items-center mb-3 border-b-2 border-black pb-2">
        <h2 className="text-lg md:text-xl font-bold">🏆 TOP 100 PLAYERS</h2>
        <button
          onClick={fetchLeaderboard}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white font-bold border-2 border-black shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '⟳' : '🔄'}
        </button>
      </div>

      {error && (
        <div className="text-center text-red-600 py-4 bg-red-50 border-2 border-red-300 mb-4">
          {error}
        </div>
      )}

      {isLoading && leaderboard.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="animate-spin text-3xl mb-2">⟳</div>
          Loading leaderboard...
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No players on the leaderboard yet. Be the first! 🎰
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.address}
                className={`flex items-center justify-between p-3 border-2 border-black ${
                  entry.rank <= 3 ? 'bg-yellow-50' : 'bg-gray-50'
                } hover:bg-blue-50 transition-colors`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="font-bold text-lg min-w-[3rem] text-center">
                    {getRankEmoji(entry.rank)}
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-sm md:text-base font-semibold">
                      {formatAddress(entry.address)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-700 text-sm md:text-base">
                    +{entry.formattedEarnings}
                  </div>
                  <div className="text-xs text-gray-600">USDC</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t-2 border-black pt-3 mt-3 text-center text-xs text-gray-600">
        Showing top {leaderboard.length} players by net earnings
      </div>
    </div>
  )
}
