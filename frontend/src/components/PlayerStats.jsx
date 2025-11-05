import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWatchContractEvent } from 'wagmi'
import { formatUnits } from 'viem'
import { ARCLOT_CONTRACT } from '../contracts/ArcClot'
import ShareButton from './ShareButton'

const SYMBOLS = ['■', '●', '▲', '◆', '★', '♦', '▼']

export default function PlayerStats({ playerStats }) {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [contractStats, setContractStats] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch stats from contract
  const fetchContractStats = async () => {
    if (!isConnected || !address || !publicClient) return

    setIsLoading(true)
    try {
      const stats = await publicClient.readContract({
        address: ARCLOT_CONTRACT.address,
        abi: ARCLOT_CONTRACT.abi,
        functionName: 'playerStats',
        args: [address]
      })

      const totalSpins = stats.totalSpins !== undefined ? Number(stats.totalSpins) : Number(stats[0])
      const totalWins = stats.totalWins !== undefined ? Number(stats.totalWins) : Number(stats[1])
      const totalPayout = stats.totalPayout !== undefined ? stats.totalPayout : stats[2]
      const lastPayout = stats.lastPayout !== undefined ? stats.lastPayout : stats[3]
      const totalBetAmount = stats.totalBetAmount !== undefined ? stats.totalBetAmount : stats[4]

      setContractStats({
        totalSpins,
        totalWins,
        totalPayout,
        lastPayout,
        totalBetAmount
      })
    } catch (error) {
      console.error('Error fetching contract stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchContractStats()
  }, [isConnected, address, publicClient, playerStats])

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
      if (userLog) {
        console.log('Spin event detected for user, refreshing stats...')
        fetchContractStats()
      }
    },
    enabled: isConnected && !!address,
  })

  // Use contract stats if available, fallback to playerStats prop
  const stats = contractStats || (playerStats ? {
    totalSpins: playerStats[0],
    totalWins: playerStats[1],
    totalPayout: playerStats[2],
    lastPayout: playerStats[3],
    totalBetAmount: playerStats[4]
  } : null)

  if (!stats) return (
    <div className="border-4 border-black bg-white p-4 w-full shadow-lg h-fit">
      <h2 className="text-lg md:text-xl font-bold text-center mb-3 border-b-2 border-black pb-2">
        📊 STATISTICS
      </h2>
      <div className="text-center text-gray-500 py-4">
        {isLoading ? 'Loading...' : 'No data yet. Play to see your stats!'}
      </div>
    </div>
  )

  const { totalSpins, totalWins, totalPayout, lastPayout, totalBetAmount } = stats
  const winRate = totalSpins > 0 ? (Number(totalWins) / Number(totalSpins) * 100).toFixed(1) : '0.0'
  
  // Calculate net profit using BigInt arithmetic first, then convert to number for display
  const payoutBigInt = typeof totalPayout === 'bigint' ? totalPayout : BigInt(totalPayout || 0)
  const betBigInt = typeof totalBetAmount === 'bigint' ? totalBetAmount : BigInt(totalBetAmount || 0)
  const netProfitBigInt = payoutBigInt - betBigInt
  const netProfitFormatted = parseFloat(formatUnits(netProfitBigInt, 18)).toFixed(2)
  const isPositive = netProfitBigInt >= 0n
  
  // Format total bet and payout
  const totalBetFormatted = parseFloat(formatUnits(betBigInt, 18)).toFixed(2)
  const totalPayoutFormatted = parseFloat(formatUnits(payoutBigInt, 18)).toFixed(2)

  return (
    <div className="border-4 border-black bg-white p-4 w-full shadow-lg h-fit">
      <h2 className="text-lg md:text-xl font-bold text-center mb-3 border-b-2 border-black pb-2">
        📊 STATISTICS
      </h2>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-2 border-2 border-black bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="text-lg md:text-xl font-bold text-black">{totalSpins.toString()}</div>
          <div className="text-xs font-semibold text-gray-600">SPINS</div>
        </div>
        
        <div className="text-center p-2 border-2 border-black bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="text-lg md:text-xl font-bold text-black">{totalWins.toString()}</div>
          <div className="text-xs font-semibold text-gray-600">WINS</div>
        </div>
        
        <div className="text-center p-2 border-2 border-black bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="text-lg md:text-xl font-bold text-black">{winRate}%</div>
          <div className="text-xs font-semibold text-gray-600">WIN RATE</div>
        </div>
        
        <div className={`text-center p-2 border-2 border-black transition-colors ${
          isPositive ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
        }`}>
          <div className={`text-lg md:text-xl font-bold ${
            isPositive ? 'text-green-700' : 'text-red-700'
          }`}>
            {isPositive ? '+' : ''}{netProfitFormatted}
          </div>
          <div className="text-xs font-semibold text-gray-600">P&L (USDC)</div>
        </div>
      </div>

      {/* Compact Additional Stats */}
      <div className="border-t-2 border-black pt-2 mt-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-1.5 bg-gray-50 border border-black">
            <div className="text-xs md:text-sm font-bold text-black">{totalBetFormatted}</div>
            <div className="text-xs text-gray-600">TOTAL BET</div>
          </div>
          <div className="text-center p-1.5 bg-gray-50 border border-black">
            <div className="text-xs md:text-sm font-bold text-black">{totalPayoutFormatted}</div>
            <div className="text-xs text-gray-600">TOTAL WON</div>
          </div>
        </div>
      </div>

      {/* Last Payout - Compact */}
      {lastPayout && lastPayout > 0n && (
        <div className="border-t-2 border-black pt-2 mt-2">
          <div className="text-center bg-yellow-50 p-2 border border-black">
            <div className="text-xs text-gray-600">LAST PAYOUT</div>
            <div className="text-sm md:text-base font-bold text-black">
              {parseFloat(formatUnits(lastPayout, 18)).toFixed(2)} USDC
            </div>
          </div>
        </div>
      )}

      {/* Share Stats Button - Compact */}
      {totalSpins > 0 && (
        <div className="border-t-2 border-black pt-2 mt-2">
          <div className="flex justify-center">
            <ShareButton
              text={`🎰 My @ArcClot Stats:\n📊 ${totalSpins} spins | ${totalWins} wins | ${winRate}% win rate\n💰 ${isPositive ? '+' : ''}${netProfitFormatted} USDC P&L\n\nPlay now on Arc Testnet! 🎲`}
              hashtags={['ArcClot', 'ArcTestnet', 'Web3Gaming', 'CryptoSlots']}
              url={window.location.origin}
              size="sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}