import React, { useState, useEffect } from 'react'
import { Home, ArrowUpDown, LineChart, TrendingUp, Clock, Wallet } from 'lucide-react'
import axios from 'axios'
import MobileMarkets from './MobileMarkets'
import MobileChart from './MobileChart'
import MobileOrder from './MobileOrder'
import MobilePositions from './MobilePositions'

const MobileTrade = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('chart')
  const [selectedSymbol, setSelectedSymbol] = useState(() => {
    return localStorage.getItem('selectedSymbol') || 'XAUUSD'
  })
  const [equity, setEquity] = useState(0)

  // Save selected symbol to localStorage
  useEffect(() => {
    localStorage.setItem('selectedSymbol', selectedSymbol)
  }, [selectedSymbol])

  useEffect(() => {
    const fetchEquity = async () => {
      const token = localStorage.getItem('token')
      if (!token) return
      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.data.success) {
          setEquity(res.data.data.balance || 0)
        }
      } catch (err) {}
    }
    fetchEquity()
    const interval = setInterval(fetchEquity, 5000)
    return () => clearInterval(interval)
  }, [])

  const tabs = [
    { id: 'markets', label: 'Markets', icon: ArrowUpDown },
    { id: 'chart', label: 'Chart', icon: LineChart },
    { id: 'trade', label: 'Trade', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: Clock },
  ]

  const handleSymbolSelect = (symbol) => {
    setSelectedSymbol(symbol)
    setActiveTab('chart')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'markets':
        return <MobileMarkets onSelect={handleSymbolSelect} selectedSymbol={selectedSymbol} />
      case 'chart':
        return <MobileChart symbol={selectedSymbol} />
      case 'trade':
        return <MobileOrder symbol={selectedSymbol} />
      case 'orders':
        return <MobilePositions />
      default:
        return <MobileChart symbol={selectedSymbol} />
    }
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#000000' }}>
      {/* Top Header */}
      <div 
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: '#0d0d0d', borderBottom: '1px solid #1a1a1a' }}
      >
        <button onClick={onBack} className="p-2 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
          <Home size={18} color="#9ca3af" />
        </button>
        
        <div className="text-center">
          <p className="text-xs" style={{ color: '#6b7280' }}>Equity</p>
          <p className="text-base font-bold" style={{ color: '#fff' }}>${equity.toFixed(2)}</p>
        </div>
        
        <button className="p-2 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}>
          <Wallet size={18} color="#22c55e" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Bottom Trade Navigation */}
      <nav 
        className="flex items-center justify-around py-2"
        style={{ backgroundColor: '#0d0d0d', borderTop: '1px solid #1a1a1a' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center py-2 px-4"
          >
            <tab.icon 
              size={20} 
              color={activeTab === tab.id ? '#22c55e' : '#6b7280'} 
            />
            <span 
              className="text-xs mt-1"
              style={{ color: activeTab === tab.id ? '#22c55e' : '#6b7280' }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default MobileTrade
