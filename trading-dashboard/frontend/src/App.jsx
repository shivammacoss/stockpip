import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import InstrumentsPanel from './components/InstrumentsPanel'
import TradingChart from './components/TradingChart'
import OrderPanel from './components/OrderPanel'
import PositionsTable from './components/PositionsTable'
import Dashboard from './components/Dashboard'
import Wallet from './components/Wallet'
import CopyTrade from './components/CopyTrade'
import IBDashboard from './components/IBDashboard'
import Orders from './components/Orders'
import Profile from './components/Profile'
import Support from './components/Support'
import TradeNotifications from './components/TradeNotifications'
import MobileApp from './components/mobile/MobileApp'

function App({ initialView = 'home' }) {
  const [activeView, setActiveView] = useState(initialView)
  const [showInstruments, setShowInstruments] = useState(true)
  const [showOrderPanel, setShowOrderPanel] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState(() => {
    // Load from localStorage or default to XAUUSD
    return localStorage.getItem('selectedSymbol') || 'XAUUSD'
  })
  const [orderType, setOrderType] = useState('market')

  // Save selected symbol to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selectedSymbol', selectedSymbol)
  }, [selectedSymbol])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [accountStats, setAccountStats] = useState({
    balance: 0,
    equity: 0,
    margin: 0,
    freeMargin: 0,
    marginLevel: 0
  })

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fetch account stats
  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        // Get user balance
        const userRes = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const balance = userRes.data.data?.balance || 0

        // Get open trades for margin calculation
        const tradesRes = await axios.get('/api/trades', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const trades = tradesRes.data.data?.trades || tradesRes.data.data || []
        const openTrades = Array.isArray(trades) ? trades.filter(t => t.status === 'open') : []

        // Calculate margin and floating PnL
        const totalMargin = openTrades.reduce((sum, t) => sum + (t.margin || 0), 0)
        const floatingPnL = openTrades.reduce((sum, t) => sum + (t.profit || 0), 0)
        const equity = balance + floatingPnL
        const freeMargin = equity - totalMargin
        const marginLevel = totalMargin > 0 ? (equity / totalMargin) * 100 : 0

        setAccountStats({
          balance,
          equity,
          margin: totalMargin,
          freeMargin,
          marginLevel
        })
      } catch (err) {
        console.error('Failed to fetch account stats')
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 3000)
    return () => clearInterval(interval)
  }, [])

  // Render mobile layout
  if (isMobile) {
    return <MobileApp />
  }

  const handleSymbolSelect = (symbol) => {
    setSelectedSymbol(symbol)
    setActiveView('chart')
  }

  const handleOpenOrder = () => {
    setShowOrderPanel(true)
  }

  return (
    <div 
      className="h-screen w-screen flex flex-col overflow-hidden transition-colors"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Trade Notifications */}
      <TradeNotifications />
      
      {/* Header */}
      <Header 
        onTradeClick={() => {
          setShowOrderPanel(!showOrderPanel)
          if (activeView === 'home') setActiveView('chart')
        }}
        showOrderPanel={showOrderPanel}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          activeView={activeView}
          setActiveView={setActiveView}
          onToggleInstruments={() => setShowInstruments(!showInstruments)}
          showInstruments={showInstruments}
        />
        
        {/* Home Dashboard View */}
        {activeView === 'home' && (
          <Dashboard />
        )}

        {/* Wallet View */}
        {activeView === 'wallet' && (
          <Wallet />
        )}

        {/* Copy Trade View */}
        {activeView === 'copy' && (
          <CopyTrade />
        )}

        {/* IB Dashboard View */}
        {activeView === 'ib' && (
          <IBDashboard />
        )}

        {/* Orders View */}
        {activeView === 'orders' && (
          <Orders />
        )}

        {/* Profile View */}
        {activeView === 'profile' && (
          <Profile />
        )}

        {/* Support View */}
        {activeView === 'support' && (
          <Support />
        )}

        {/* Chart View */}
        {activeView === 'chart' && (
          <>
            {/* Instruments Panel */}
            {showInstruments && (
              <InstrumentsPanel 
                onClose={() => setShowInstruments(false)}
                onSelectSymbol={handleSymbolSelect}
                selectedSymbol={selectedSymbol}
              />
            )}
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chart Area */}
              <div className="flex-1 flex flex-col relative">
                {/* TradingView Chart */}
                <div className="flex-1">
                  <TradingChart symbol={selectedSymbol} />
                </div>
              </div>
              
              {/* Positions Table */}
              <PositionsTable />
            </div>
            
            {/* Order Panel */}
            {showOrderPanel && (
              <OrderPanel 
                symbol={selectedSymbol}
                orderType={orderType}
                setOrderType={setOrderType}
                onClose={() => setShowOrderPanel(false)}
              />
            )}
          </>
        )}
      </div>
      
      {/* Bottom Status Bar - Responsive */}
      <div 
        className="h-7 flex items-center justify-between px-2 sm:px-4 text-xs transition-colors overflow-x-auto"
        style={{ 
          backgroundColor: 'var(--bg-secondary)', 
          borderTop: '1px solid var(--border-color)',
          color: 'var(--text-secondary)'
        }}
      >
        <div className="flex items-center gap-3 sm:gap-6 whitespace-nowrap">
          <span className="flex items-center gap-1">
            <span className="hidden sm:inline">Balance:</span>
            <span className="sm:hidden">Bal:</span>
            <span style={{ color: 'var(--text-primary)' }}>${accountStats.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="hidden sm:inline">Equity:</span>
            <span className="sm:hidden">Eq:</span>
            <span style={{ color: accountStats.equity >= accountStats.balance ? 'var(--accent-green)' : 'var(--accent-red)' }}>${accountStats.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="hidden sm:inline">Margin:</span>
            <span className="sm:hidden">Mrg:</span>
            <span style={{ color: '#fbbf24' }}>${accountStats.margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="hidden sm:inline">Free:</span>
            <span className="sm:hidden">Fr:</span>
            <span style={{ color: accountStats.freeMargin >= 0 ? 'var(--text-primary)' : 'var(--accent-red)' }}>${accountStats.freeMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="hidden sm:inline">Level:</span>
            <span className="sm:hidden">Lvl:</span>
            <span style={{ color: accountStats.marginLevel > 100 ? 'var(--accent-green)' : accountStats.marginLevel > 50 ? '#fbbf24' : 'var(--accent-red)' }}>{accountStats.marginLevel.toFixed(2)}%</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export default App
