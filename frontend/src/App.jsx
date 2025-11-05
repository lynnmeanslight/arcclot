import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/wagmi'
import Header from './components/Header'
import NetworkStatus from './components/NetworkStatus'
import AutoNetworkSwitcher from './components/AutoNetworkSwitcher'
import SlotMachine from './components/SlotMachine'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-white">
          <AutoNetworkSwitcher />
          <Header />
          <NetworkStatus />
          <SlotMachine />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App