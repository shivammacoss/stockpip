import React, { useState, useEffect } from 'react'
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Clock,
  Loader2
} from 'lucide-react'
import axios from 'axios'

const OverviewDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalUserFund: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalEarnings: 0,
    brokerProfit: 0
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentTrades, setRecentTrades] = useState([])
  const [pendingTransactions, setPendingTransactions] = useState([])

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
  })

  useEffect(() => {
    fetchDashboardData()
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchDashboardData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      console.error('[AdminDashboard] No admin token found')
      setLoading(false)
      return
    }

    try {
      // Fetch dashboard stats
      const dashRes = await axios.get('/api/admin/dashboard', getAuthHeader())
      console.log('[AdminDashboard] Stats response:', dashRes.data)
      if (dashRes.data.success) {
        setStats(dashRes.data.data)
      }

      // Fetch users
      const usersRes = await axios.get('/api/admin/users?limit=5', getAuthHeader())
      console.log('[AdminDashboard] Users response:', usersRes.data)
      if (usersRes.data.success) {
        setRecentUsers(usersRes.data.data.users || [])
      }

      // Fetch trades
      try {
        const tradesRes = await axios.get('/api/admin/trades?limit=10', getAuthHeader())
        console.log('[AdminDashboard] Trades response:', tradesRes.data)
        if (tradesRes.data.success) {
          setRecentTrades(tradesRes.data.data?.trades || tradesRes.data.data || [])
        }
      } catch (e) {
        console.error('[AdminDashboard] Failed to fetch trades:', e.response?.data || e.message)
      }

      // Fetch pending transactions
      try {
        const transRes = await axios.get('/api/admin/transactions/pending', getAuthHeader())
        console.log('[AdminDashboard] Transactions response:', transRes.data)
        if (transRes.data.success) {
          setPendingTransactions(transRes.data.data || [])
        }
      } catch (e) {
        console.error('[AdminDashboard] Failed to fetch transactions:', e.response?.data || e.message)
      }

    } catch (err) {
      console.error('[AdminDashboard] Error:', err.response?.data || err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (date) => {
    if (!date) return 'N/A'
    const now = new Date()
    const past = new Date(date)
    const diffMs = now - past
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 60) return `${diffMins} mins ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    return `${diffDays} days ago`
  }

  const statsDisplay = [
    { label: 'Total Users', value: stats.totalUsers?.toString() || '0', icon: Users, color: '#3b82f6' },
    { label: 'Total User Fund', value: `$${(stats.totalUserFund || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, color: '#22c55e' },
    { label: 'Deposit Requests', value: stats.pendingDeposits?.toString() || '0', icon: ArrowUpRight, color: '#22c55e' },
    { label: 'Withdrawal Requests', value: stats.pendingWithdrawals?.toString() || '0', icon: ArrowDownRight, color: '#ef4444' },
    { label: 'Total Earnings', value: `$${(stats.totalEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: BarChart3, color: '#8b5cf6' },
    { label: "Broker's Profit", value: `$${(stats.brokerProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: PieChart, color: stats.brokerProfit >= 0 ? '#22c55e' : '#ef4444' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--text-muted)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsDisplay.map((stat, index) => (
          <div
            key={index}
            className="p-4 rounded-2xl"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div 
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Users</h3>
            <button className="text-sm text-blue-500 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="text-left py-3 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>User</th>
                  <th className="text-left py-3 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-left py-3 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Balance</th>
                  <th className="text-left py-3 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      No users found
                    </td>
                  </tr>
                ) : recentUsers.map((user) => (
                  <tr key={user._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                          {user.firstName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.firstName} {user.lastName}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: user.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: user.isActive ? '#22c55e' : '#ef4444'
                        }}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>${(user.balance || 0).toLocaleString()}</td>
                    <td className="py-3 px-2 text-xs" style={{ color: 'var(--text-muted)' }}>{formatTimeAgo(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Actions */}
        <div 
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Pending Actions</h3>
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{pendingTransactions.length}</span>
          </div>
          <div className="space-y-3">
            {pendingTransactions.length === 0 ? (
              <p className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>No pending actions</p>
            ) : pendingTransactions.map((action) => (
              <div 
                key={action._id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ backgroundColor: 'var(--bg-hover)' }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: action.type === 'withdrawal' ? 'rgba(239, 68, 68, 0.1)' :
                                       action.type === 'deposit' ? 'rgba(34, 197, 94, 0.1)' :
                                       'rgba(59, 130, 246, 0.1)'
                    }}
                  >
                    <Clock size={18} style={{ 
                      color: action.type === 'withdrawal' ? '#ef4444' :
                             action.type === 'deposit' ? '#22c55e' : '#3b82f6'
                    }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{action.type}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{action.userId?.firstName || 'User'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>${(action.amount || 0).toLocaleString()}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatTimeAgo(action.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div 
        className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Trades</h3>
          <button className="text-sm text-blue-500 hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th className="text-left py-3 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>User</th>
                <th className="text-left py-3 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Pair</th>
                <th className="text-left py-3 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Type</th>
                <th className="text-left py-3 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Amount</th>
                <th className="text-left py-3 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Profit/Loss</th>
                <th className="text-left py-3 px-2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No trades found
                  </td>
                </tr>
              ) : recentTrades.map((trade) => (
                <tr key={trade._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td className="py-3 px-2 text-sm" style={{ color: 'var(--text-primary)' }}>{trade.userId?.firstName || 'User'}</td>
                  <td className="py-3 px-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{trade.symbol}</td>
                  <td className="py-3 px-2">
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium uppercase"
                      style={{
                        backgroundColor: trade.type === 'buy' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: trade.type === 'buy' ? '#22c55e' : '#ef4444'
                      }}
                    >
                      {trade.type}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm" style={{ color: 'var(--text-primary)' }}>${(trade.amount || 0).toLocaleString()}</td>
                  <td className="py-3 px-2 text-sm font-medium" style={{ color: (trade.profit || 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                    {(trade.profit || 0) >= 0 ? '+' : ''}${(trade.profit || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-2">
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                      style={{
                        backgroundColor: trade.status === 'open' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: trade.status === 'open' ? '#3b82f6' : '#6b7280'
                      }}
                    >
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default OverviewDashboard
