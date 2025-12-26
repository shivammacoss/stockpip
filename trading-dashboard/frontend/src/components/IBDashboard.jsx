import React, { useState, useEffect } from 'react'
import {
  Users,
  DollarSign,
  TrendingUp,
  Copy,
  Link,
  Wallet,
  ArrowDownToLine,
  History,
  UserPlus,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  ExternalLink,
  Share2
} from 'lucide-react'
import axios from 'axios'

const IBDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [referrals, setReferrals] = useState([])
  const [commissions, setCommissions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [profileRes, statsRes, referralsRes, commissionsRes, withdrawalsRes] = await Promise.all([
        axios.get('/api/ib/profile', getAuthHeader()),
        axios.get('/api/ib/stats', getAuthHeader()),
        axios.get('/api/ib/referrals', getAuthHeader()),
        axios.get('/api/ib/commissions', getAuthHeader()),
        axios.get('/api/ib/withdrawals', getAuthHeader())
      ])

      if (profileRes.data.success) setProfile(profileRes.data.data)
      if (statsRes.data.success) setStats(statsRes.data.data)
      if (referralsRes.data.success) setReferrals(referralsRes.data.data)
      if (commissionsRes.data.success) setCommissions(commissionsRes.data.data)
      if (withdrawalsRes.data.success) setWithdrawals(withdrawalsRes.data.data)
    } catch (err) {
      console.error('Failed to fetch IB data:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return
    try {
      setSubmitting(true)
      const res = await axios.post('/api/ib/withdraw-to-wallet', { amount: parseFloat(withdrawAmount) }, getAuthHeader())
      if (res.data.success) {
        alert(res.data.message)
        setWithdrawAmount('')
        fetchData()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to withdraw')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--text-muted)' }} />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>IB Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Introducing Broker • {profile?.ibId}
          </p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
          <RefreshCw size={20} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Referral Link Card */}
      <div className="rounded-2xl p-6 mb-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm mb-1">Your Referral Link</p>
            <p className="text-white font-mono text-lg break-all">{profile?.referralLink}</p>
            <p className="text-blue-200 text-sm mt-2">
              Referral Code: <span className="font-bold text-white">{profile?.referralCode}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => copyToClipboard(profile?.referralLink)}
              className="p-3 rounded-xl bg-white/20 hover:bg-white/30 text-white"
              title="Copy Link"
            >
              {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'Join Bull4x', url: profile?.referralLink })
                }
              }}
              className="p-3 rounded-xl bg-white/20 hover:bg-white/30 text-white"
              title="Share"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10">
              <Users size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Referrals</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.totalReferrals || 0}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/10">
              <UserPlus size={20} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Active Traders</p>
              <p className="text-xl font-bold" style={{ color: '#22c55e' }}>{stats?.activeReferrals || 0}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10">
              <TrendingUp size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Trading Volume</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats?.totalTradingVolume?.toFixed(2) || 0} lots</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-500/10">
              <DollarSign size={20} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Deposits</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>${stats?.totalDeposits?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Wallet size={20} /> IB Wallet
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Available Balance</p>
            <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>${stats?.availableBalance?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Earned</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>${stats?.totalCommissionEarned?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pending Withdrawals</p>
            <p className="text-2xl font-bold" style={{ color: '#fbbf24' }}>${stats?.pendingWithdrawals?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Withdrawn</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>${stats?.totalWithdrawn?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Amount to withdraw"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleWithdraw}
            disabled={submitting || !withdrawAmount}
            className="px-6 py-3 rounded-xl bg-green-500 text-white font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowDownToLine size={18} />
            {submitting ? 'Processing...' : 'Transfer to Wallet'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className="px-5 py-2 rounded-xl font-medium"
          style={{ backgroundColor: activeTab === 'overview' ? 'var(--accent-blue)' : 'var(--bg-card)', color: activeTab === 'overview' ? '#fff' : 'var(--text-secondary)' }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className="px-5 py-2 rounded-xl font-medium"
          style={{ backgroundColor: activeTab === 'referrals' ? 'var(--accent-blue)' : 'var(--bg-card)', color: activeTab === 'referrals' ? '#fff' : 'var(--text-secondary)' }}
        >
          Referrals ({referrals.length})
        </button>
        <button
          onClick={() => setActiveTab('commissions')}
          className="px-5 py-2 rounded-xl font-medium"
          style={{ backgroundColor: activeTab === 'commissions' ? 'var(--accent-blue)' : 'var(--bg-card)', color: activeTab === 'commissions' ? '#fff' : 'var(--text-secondary)' }}
        >
          Commissions
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className="px-5 py-2 rounded-xl font-medium"
          style={{ backgroundColor: activeTab === 'withdrawals' ? 'var(--accent-blue)' : 'var(--bg-card)', color: activeTab === 'withdrawals' ? '#fff' : 'var(--text-secondary)' }}
        >
          Withdrawals
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Commission Model */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Your Commission Model</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Type:</span>
                <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{profile?.commissionType?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Rate:</span>
                <span className="font-medium" style={{ color: '#22c55e' }}>
                  {profile?.commissionType === 'per_lot' ? `$${profile?.commissionValue} per lot` :
                   profile?.commissionType === 'percentage_profit' ? `${profile?.commissionValue}% of profit` :
                   `${profile?.commissionValue}%`}
                </span>
              </div>
              {profile?.firstDepositCommission?.enabled && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>First Deposit Bonus:</span>
                  <span className="font-medium" style={{ color: '#22c55e' }}>{profile?.firstDepositCommission?.percentage}%</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${profile?.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {profile?.status}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Commissions */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Commissions</h3>
            {commissions.length === 0 ? (
              <p className="text-center py-4" style={{ color: 'var(--text-muted)' }}>No commissions yet</p>
            ) : (
              <div className="space-y-3">
                {commissions.slice(0, 5).map((c) => (
                  <div key={c._id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {c.sourceUserId?.firstName} {c.sourceUserId?.lastName}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {c.sourceType === 'trade' ? `${c.symbol} • ${c.lots} lots` : c.sourceType}
                      </p>
                    </div>
                    <span className="font-bold" style={{ color: '#22c55e' }}>+${c.commissionAmount?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {referrals.length === 0 ? (
            <p className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No referrals yet. Share your link to start earning!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>User</th>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Registered</th>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>First Deposit</th>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Volume</th>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Commission</th>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.referredUserId?.firstName} {r.referredUserId?.lastName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.referredUserId?.email}</p>
                      </td>
                      <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(r.registeredAt).toLocaleDateString()}</td>
                      <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-primary)' }}>${r.stats?.firstDeposit || 0}</td>
                      <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-primary)' }}>{r.stats?.totalTradingVolume?.toFixed(2) || 0} lots</td>
                      <td className="py-4 px-4 text-sm font-semibold" style={{ color: '#22c55e' }}>${r.stats?.commissionGenerated?.toFixed(2) || 0}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Commissions Tab */}
      {activeTab === 'commissions' && (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {commissions.length === 0 ? (
            <p className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No commission history yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Date</th>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Source User</th>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Type</th>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Details</th>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(c.createdAt).toLocaleString()}</td>
                      <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-primary)' }}>{c.sourceUserId?.firstName} {c.sourceUserId?.lastName}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 rounded-lg text-xs capitalize" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                          {c.sourceType?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {c.sourceType === 'trade' ? `${c.symbol} • ${c.lots} lots` : c.sourceType === 'first_deposit' ? `$${c.depositAmount}` : '-'}
                      </td>
                      <td className="py-4 px-4 text-sm font-bold" style={{ color: '#22c55e' }}>+${c.commissionAmount?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === 'withdrawals' && (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {withdrawals.length === 0 ? (
            <p className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No withdrawal history yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Date</th>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Amount</th>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Method</th>
                    <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(w.createdAt).toLocaleString()}</td>
                      <td className="py-4 px-4 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>${w.amount?.toFixed(2)}</td>
                      <td className="py-4 px-4 text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>{w.method}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          w.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                          w.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                          w.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default IBDashboard
