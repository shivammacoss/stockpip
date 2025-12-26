import React, { useState } from 'react'
import { Home, TrendingUp, Wallet, Menu, X, ArrowLeft } from 'lucide-react'
import MobileHome from './MobileHome'
import MobileTrade from './MobileTrade'
import MobileWallet from './MobileWallet'
import MobileMore from './MobileMore'
import MobileIB from './MobileIB'
import MobileCopyTrade from './MobileCopyTrade'
import MobileSupport from './MobileSupport'
import MobileProfile from './MobileProfile'

const MobileApp = () => {
  const [activeTab, setActiveTab] = useState('home')
  const [showMore, setShowMore] = useState(false)

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'trade', label: 'Trade', icon: TrendingUp },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'more', label: 'More', icon: Menu },
  ]

  const morePages = ['ib', 'copy', 'support', 'profile']

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <MobileHome />
      case 'trade':
        return <MobileTrade onBack={() => setActiveTab('home')} />
      case 'wallet':
        return <MobileWallet />
      case 'ib':
        return <MobileIB onBack={() => setActiveTab('home')} />
      case 'copy':
        return <MobileCopyTrade onBack={() => setActiveTab('home')} />
      case 'support':
        return <MobileSupport onBack={() => setActiveTab('home')} />
      case 'profile':
        return <MobileProfile onBack={() => setActiveTab('home')} />
      default:
        return <MobileHome />
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ backgroundColor: '#000000' }}>
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>

      {/* Bottom Navigation - Hidden when in Trade view or More pages */}
      {!['trade', 'ib', 'copy', 'support', 'profile'].includes(activeTab) && (
        <nav 
          className="flex items-center justify-around py-2"
          style={{ 
            backgroundColor: '#0d0d0d',
            borderTop: '1px solid #1a1a1a'
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'more') {
                  setShowMore(true)
                } else {
                  setActiveTab(tab.id)
                }
              }}
              className="flex flex-col items-center py-2 px-6"
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
      )}

      {/* More Menu Overlay */}
      {showMore && (
        <MobileMore onClose={() => setShowMore(false)} onNavigate={(view) => {
          setShowMore(false)
          setActiveTab(view)
        }} />
      )}
    </div>
  )
}

export default MobileApp
