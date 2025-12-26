import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Home, 
  LayoutGrid, 
  BarChart3, 
  Users, 
  ClipboardList, 
  Headphones,
  Wallet,
  Sun,
  Moon,
  UserPlus,
  UserCircle
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const Sidebar = ({ activeView, setActiveView, onToggleInstruments, showInstruments }) => {
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigation = (view, path) => {
    setActiveView(view)
    navigate(path)
  }

  const menuItems = [
    { icon: Home, label: 'Dashboard', id: 'home', path: '/home', onClick: () => handleNavigation('home', '/home') },
    { icon: BarChart3, label: 'Chart', id: 'chart', path: '/trade', onClick: () => handleNavigation('chart', '/trade') },
    { icon: LayoutGrid, label: 'Instruments', id: 'instruments', path: null, onClick: onToggleInstruments },
    { icon: ClipboardList, label: 'Orders', id: 'orders', path: '/orders', onClick: () => handleNavigation('orders', '/orders') },
    { icon: Wallet, label: 'Wallet', id: 'wallet', path: '/wallet', onClick: () => handleNavigation('wallet', '/wallet') },
    { icon: Users, label: 'Copy Trading', id: 'copy', path: '/copytrade', onClick: () => handleNavigation('copy', '/copytrade') },
    { icon: UserPlus, label: 'IB Dashboard', id: 'ib', path: '/ib', onClick: () => handleNavigation('ib', '/ib') },
    { icon: UserCircle, label: 'Profile', id: 'profile', path: '/profile', onClick: () => handleNavigation('profile', '/profile') },
    { icon: Headphones, label: 'Support', id: 'support', path: '/support', onClick: () => handleNavigation('support', '/support') },
  ]

  const isActive = (item) => {
    // Check both activeView and current URL path
    if (item.path && location.pathname === item.path) return true
    if (item.id === 'home') return activeView === 'home' || location.pathname === '/home'
    if (item.id === 'chart') return activeView === 'chart' || location.pathname === '/trade'
    if (item.id === 'wallet') return activeView === 'wallet' || location.pathname === '/wallet'
    if (item.id === 'copy') return activeView === 'copy' || location.pathname === '/copytrade'
    if (item.id === 'ib') return activeView === 'ib' || location.pathname === '/ib'
    if (item.id === 'orders') return activeView === 'orders' || location.pathname === '/orders'
    if (item.id === 'profile') return activeView === 'profile' || location.pathname === '/profile'
    if (item.id === 'support') return activeView === 'support' || location.pathname === '/support'
    if (item.id === 'instruments') return showInstruments && (activeView === 'chart' || location.pathname === '/trade')
    return false
  }

  return (
    <div className="w-14 flex flex-col items-center py-4 transition-colors"
      style={{ 
        backgroundColor: 'var(--bg-secondary)', 
        borderRight: '1px solid var(--border-color)' 
      }}
    >
      {/* Logo */}
      <div className="mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center font-bold text-white text-sm">
          B4X
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="flex-1 flex flex-col gap-2">
        {menuItems.map((item, index) => {
          const active = isActive(item)
          return (
            <button
              key={index}
              onClick={item.onClick}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all"
              style={{
                backgroundColor: active ? 'var(--bg-hover)' : 'transparent',
                color: active ? 'var(--accent-green)' : 'var(--text-secondary)'
              }}
              title={item.label}
            >
              <item.icon size={20} />
            </button>
          )
        })}
      </div>
      
      {/* Bottom Items */}
      <div className="flex flex-col gap-2">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110"
          style={{
            backgroundColor: 'var(--bg-hover)',
            color: isDark ? '#fbbf24' : '#3b82f6'
          }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  )
}

export default Sidebar
