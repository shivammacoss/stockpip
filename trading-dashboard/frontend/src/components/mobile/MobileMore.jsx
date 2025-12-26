import React from 'react'
import { X, Users2, Copy, Headphones, User, LogOut, Moon, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const MobileMore = ({ onClose, onNavigate }) => {
  const navigate = useNavigate()

  const menuItems = [
    { id: 'ib', label: 'IB Program', icon: Users2, desc: 'Refer & earn commissions' },
    { id: 'copy', label: 'Copy Trade', icon: Copy, desc: 'Follow expert traders' },
    { id: 'support', label: 'Support', icon: Headphones, desc: 'Get help' },
    { id: 'profile', label: 'Profile', icon: User, desc: 'Account settings' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div 
        className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-4"
        style={{ backgroundColor: '#0d0d0d' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: '#fff' }}>More</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg"
            style={{ backgroundColor: '#1a1a1a' }}
          >
            <X size={18} color="#9ca3af" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="space-y-2 mb-4">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl"
              style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a' }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#1a1a1a' }}
                >
                  <item.icon size={18} color="#22c55e" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: '#fff' }}>{item.label}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>{item.desc}</p>
                </div>
              </div>
              <ChevronRight size={18} color="#6b7280" />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button 
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
            style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a' }}
          >
            <Moon size={16} color="#9ca3af" />
            <span className="text-sm" style={{ color: '#9ca3af' }}>Theme</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}
          >
            <LogOut size={16} color="#ef4444" />
            <span className="text-sm" style={{ color: '#ef4444' }}>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileMore
