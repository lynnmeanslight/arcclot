import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { ARCLOT_CONTRACT } from '../contracts/ArcClot'
import PlayerStats from './PlayerStats'
import NetworkChecker from './NetworkChecker'
import ShareButton from './ShareButton'
import Leaderboard from './Leaderboard'

const SYMBOLS = ['■', '●', '▲', '◆', '★', '♦', '▼']

export default function SlotMachine() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash })
  const publicClient = usePublicClient()
  
  const [betAmount, setBetAmount] = useState('0.5')
  const [reels, setReels] = useState([0, 1, 2])
  const [isSpinning, setIsSpinning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [spinInterval, setSpinInterval] = useState(null)
  const [audio, setAudio] = useState(null)

  // Initialize audio on mount
  useEffect(() => {
    const coinAudio = new Audio('/coin_up.mp3')
    coinAudio.loop = true // Loop the sound while spinning
    setAudio(coinAudio)
    
    return () => {
      if (coinAudio) {
        coinAudio.pause()
        coinAudio.src = ''
      }
    }
  }, [])

  // Read contract data
  const { data: minBet } = useReadContract({
    ...ARCLOT_CONTRACT,
    functionName: 'minBet',
  })

  const { data: playerStats, refetch: refetchStats } = useReadContract({
    ...ARCLOT_CONTRACT,
    functionName: 'playerStats',
    args: [address],
    enabled: !!address,
  })

  const handleSpin = async () => {
    if (!isConnected || isSpinning) return

    try {
      setIsSpinning(true)
      setLastResult(null)
      
      // Play spinning sound
      if (audio) {
        audio.currentTime = 0
        audio.play().catch(err => console.error('Audio play failed:', err))
      }
      
      // Start animate reels spinning
      const interval = setInterval(() => {
        setReels([
          Math.floor(Math.random() * 7),
          Math.floor(Math.random() * 7),
          Math.floor(Math.random() * 7)
        ])
      }, 100)
      setSpinInterval(interval)

      // Send transaction to contract with explicit gas limit
      await writeContract({
        ...ARCLOT_CONTRACT,
        functionName: 'spin',
        value: parseUnits(betAmount,18), // USDC uses 6 decimals
        gas: 200000n, // Set explicit gas limit to avoid out of gas errors
      })
    } catch (err) {
      console.error('Spin failed:', err)
      setIsSpinning(false)
      
      // Stop audio on error
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      
      if (spinInterval) {
        clearInterval(spinInterval)
        setSpinInterval(null)
      }
    }
  }

  // Listen for transaction success and parse Spin event
  useEffect(() => {
    const handleTransactionSuccess = async () => {
      if (isSuccess && receipt && publicClient) {
        try {
          // Get the Spin event from the transaction receipt
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
            fromBlock: receipt.blockNumber,
            toBlock: receipt.blockNumber,
          })

          // Find the log that matches our transaction
          const spinLog = logs.find(log => log.transactionHash === receipt.transactionHash)
          
          if (spinLog) {
            const result = spinLog.args.result
            const payout = spinLog.args.payout
            
            // Stop spinning animation and show actual result
            if (spinInterval) {
              clearInterval(spinInterval)
              setSpinInterval(null)
            }
            
            // Stop audio when result appears
            if (audio) {
              audio.pause()
              audio.currentTime = 0
            }
            
            // Set the actual result from contract
            setReels([Number(result[0]), Number(result[1]), Number(result[2])])
            setLastResult({
              result: result,
              payout: payout,
              bet: spinLog.args.bet
            })
            
            setIsSpinning(false)
            
            // Refetch player stats
            refetchStats()
          }
        } catch (err) {
          console.error('Error fetching Spin event:', err)
          setIsSpinning(false)
          
          // Stop audio on error
          if (audio) {
            audio.pause()
            audio.currentTime = 0
          }
          
          if (spinInterval) {
            clearInterval(spinInterval)
            setSpinInterval(null)
          }
        }
      }
    }

    handleTransactionSuccess()
  }, [isSuccess, receipt, publicClient, spinInterval, refetchStats, audio])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 md:p-8 pt-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-4 tracking-wider">ARCCLOT</h1>
          <div className="w-24 md:w-32 h-px bg-black mx-auto mb-8"></div>
          <div className="border-4 border-black bg-white p-6 md:p-8">
            <div className="text-lg font-bold mb-4">WALLET NOT CONNECTED</div>
            <div className="text-sm text-gray-600">
              Please connect your wallet using the button above
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <NetworkChecker>
      <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8 pt-20 md:pt-24 pb-8 mt-20">
        <div className="max-w-7xl mx-auto">

          {/* Main Game Container */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
            
            {/* Slot Machine with Promo Cards - Takes 3 columns on desktop */}
            <div className="lg:col-span-3 order-1 space-y-6">
              {/* Slot Machine */}
              <div className="border-4 border-black bg-white p-6 md:p-8 lg:p-10 shadow-lg">
                {/* Reels */}
                <div className="flex space-x-2 sm:space-x-3 md:space-x-4 mb-6 md:mb-8 justify-center">
                  {reels.map((symbol, index) => (
                    <div
                      key={index}
                      className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 border-2 md:border-4 border-black bg-white flex items-center justify-center text-3xl sm:text-4xl md:text-5xl transition-all duration-200 ${
                        isSpinning ? 'animate-pulse scale-105' : 'scale-100'
                      }`}
                    >
                      {SYMBOLS[symbol]}
                    </div>
                  ))}
                </div>

                {/* Bet Input */}
                <div className="text-center mb-6">
                  <label className="block text-sm md:text-base font-bold mb-3">BET AMOUNT (USDC)</label>
                  <div className="flex justify-center items-center space-x-2 mb-2">
                    <button
                      onClick={() => setBetAmount((Math.max(0.5, parseFloat(betAmount) - 0.5)).toString())}
                      disabled={isSpinning || isPending || parseFloat(betAmount) <= 0.5}
                      className="w-10 h-10 border-2 border-black bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold text-lg"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      min="0.5"
                      step="0.5"
                      className="w-28 sm:w-32 md:w-36 p-3 border-2 border-black text-center bg-white focus:outline-none focus:ring-2 focus:ring-black text-base md:text-lg font-bold"
                      disabled={isSpinning || isPending}
                    />
                    <button
                      onClick={() => setBetAmount((parseFloat(betAmount) + 0.5).toString())}
                      disabled={isSpinning || isPending}
                      className="w-10 h-10 border-2 border-black bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                  {minBet && (
                    <p className="text-xs md:text-sm text-gray-600 mt-2">
                      MIN: {formatUnits(minBet)} USDC
                    </p>
                  )}
                </div>

                {/* Spin Button */}
                <div className="text-center mb-6">
                  <button
                    onClick={handleSpin}
                    disabled={isSpinning || isPending || isConfirming}
                    className="w-full px-8 py-4 bg-black text-white font-bold text-base md:text-lg hover:bg-gray-800 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
                  >
                    {isSpinning || isConfirming ? '🎰 SPINNING...' : isPending ? '⏳ CONFIRMING...' : '🎰 SPIN NOW'}
                  </button>
                </div>

                {/* Last Result */}
                {lastResult && (
                  <div className="p-4 md:p-6 border-2 border-black bg-gradient-to-b from-gray-50 to-white">
                    <div className="text-center">
                      <div className={`font-bold text-xl md:text-2xl mb-3 ${lastResult.payout > 0n ? 'text-green-600' : 'text-gray-600'}`}>
                        {lastResult.payout > 0n ? '🎉 YOU WON!' : '😔 NO WIN'}
                      </div>
                      {lastResult.payout > 0n && (
                        <>
                          <div className="text-3xl md:text-4xl font-bold text-black mb-3">
                            +{parseFloat(formatUnits(lastResult.payout, 18)).toFixed(2)} USDC
                          </div>
                          <div className="flex justify-center mt-4">
                            <ShareButton
                              text={`🎰 Just won ${parseFloat(formatUnits(lastResult.payout, 18)).toFixed(2)} USDC on ArcClot! ${SYMBOLS[lastResult.result[0]]} ${SYMBOLS[lastResult.result[1]]} ${SYMBOLS[lastResult.result[2]]} 🎉`}
                              hashtags={['ArcClot', 'ArcTestnet', 'Web3Gaming', 'CryptoSlots']}
                              url={window.location.origin}
                              size="md"
                            />
                          </div>
                        </>
                      )}
                      <div className="text-sm md:text-base text-gray-600 mt-3">
                        Bet: {parseFloat(formatUnits(lastResult.bet, 18)).toFixed(2)} USDC
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {error && (
                  <div className="mt-4 p-4 border-2 border-red-500 bg-red-50 text-center">
                    <div className="font-bold text-red-700 mb-1">⚠️ ERROR</div>
                    <div className="text-xs md:text-sm text-red-600">{error.shortMessage || error.message}</div>
                  </div>
                )}

                {isConfirming && !lastResult && (
                  <div className="mt-4 p-4 border-2 border-yellow-500 bg-yellow-50 text-center">
                    <div className="font-bold text-yellow-700">⏳ WAITING FOR CONFIRMATION...</div>
                    <div className="text-xs md:text-sm text-yellow-600 mt-1">Please wait while the transaction is being processed</div>
                  </div>
                )}
              </div>

              {/* Promo Cards - Same width as slot machine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Follow Creator */}
                <div className="border-4 border-black p-4 bg-gray-50">
                  <h3 className="font-bold text-sm md:text-base mb-2">📱 FOLLOW THE CREATOR</h3>
                  <p className="text-xs md:text-sm mb-3 text-gray-600">
                    Support the creator by following on X
                  </p>
                  <a 
                    href="https://x.com/lynnthelight" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors text-xs md:text-sm"
                  >
                    Follow @lynnthelight
                  </a>
                </div>

                {/* Giveaway */}
                <div className="border-4 border-black p-4 bg-yellow-50">
                  <h3 className="font-bold text-sm md:text-base mb-2">🎉 1000 USDC GIVEAWAY!</h3>
                  <p className="text-xs md:text-sm mb-3 text-gray-600">
                    Participate in the Arc Testnet giveaway
                  </p>
                  <a 
                    href="https://x.com/lynnthelight/status/1984585603569377355" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-2 bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors text-xs md:text-sm"
                  >
                    Like & Retweet to Win
                  </a>
                </div>
              </div>
            </div>

            {/* Player Stats and Leaderboard - Takes 2 columns on desktop, below on mobile */}
            <div className="lg:col-span-2 order-2 space-y-6">
              <PlayerStats playerStats={playerStats} />
              <Leaderboard />
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Crafted by <span className="font-bold">lynnthelight</span> © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </NetworkChecker>
  )
}