import React, { useState, useEffect } from 'react'
import {
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Filter,
  Loader2,
  X,
  Image
} from 'lucide-react'
import axios from 'axios'

const FundManagement = () => {
  const [activeTab, setActiveTab] = useState('deposits')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [deposits, setDeposits] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [selectedTx, setSelectedTx] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [depRes, withRes] = await Promise.all([
        axios.get('/api/admin/wallet/deposits', getAuthHeader()),
        axios.get('/api/admin/wallet/withdrawals', getAuthHeader())
      ])
      if (depRes.data.success) setDeposits(depRes.data.data || [])
      if (withRes.data.success) setWithdrawals(withRes.data.data || [])
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (tx) => {
    if (!confirm(`Approve this ${tx.type}?`)) return
    try {
      setActionLoading(tx._id)
      const endpoint = tx.type === 'deposit' 
        ? `/api/admin/wallet/deposits/${tx._id}/approve`
        : `/api/admin/wallet/withdrawals/${tx._id}/approve`
      const res = await axios.put(endpoint, {}, getAuthHeader())
      if (res.data.success) {
        alert(`${tx.type} approved successfully!`)
        fetchData()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!selectedTx) return
    try {
      setActionLoading(selectedTx._id)
      const endpoint = selectedTx.type === 'deposit'
        ? `/api/admin/wallet/deposits/${selectedTx._id}/reject`
        : `/api/admin/wallet/withdrawals/${selectedTx._id}/reject`
      const res = await axios.put(endpoint, { rejectionReason: rejectReason }, getAuthHeader())
      if (res.data.success) {
        alert(`${selectedTx.type} rejected`)
        setShowRejectModal(false)
        setRejectReason('')
        setSelectedTx(null)
        fetchData()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  const currentData = activeTab === 'deposits' ? deposits : withdrawals
  const filteredData = currentData.filter(item => {
    const userName = item.userId?.firstName || ''
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item._id || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || (item.status || '').toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesFilter
  })

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', icon: CheckCircle }
      case 'approved': return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', icon: CheckCircle }
      case 'pending': return { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', icon: Clock }
      case 'failed': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: XCircle }
      case 'rejected': return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: XCircle }
      default: return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', icon: Clock }
    }
  }

  const totalDeposits = deposits.filter(d => d.status === 'completed').reduce((sum, d) => sum + (d.amount || 0), 0)
  const totalWithdrawals = withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + (w.amount || 0), 0)
  const pendingDeposits = deposits.filter(d => d.status === 'pending').length
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <ArrowDownRight size={20} style={{ color: '#22c55e' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Deposits</p>
              <p className="text-xl font-bold" style={{ color: '#22c55e' }}>${totalDeposits.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <ArrowUpRight size={20} style={{ color: '#ef4444' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Withdrawals</p>
              <p className="text-xl font-bold" style={{ color: '#ef4444' }}>${totalWithdrawals.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
              <Clock size={20} style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pending Deposits</p>
              <p className="text-xl font-bold" style={{ color: '#fbbf24' }}>{pendingDeposits}</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)' }}>
              <Clock size={20} style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pending Withdrawals</p>
              <p className="text-xl font-bold" style={{ color: '#fbbf24' }}>{pendingWithdrawals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('deposits')}
          className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors`}
          style={{
            backgroundColor: activeTab === 'deposits' ? '#22c55e' : 'var(--bg-card)',
            color: activeTab === 'deposits' ? '#ffffff' : 'var(--text-secondary)',
            border: activeTab === 'deposits' ? 'none' : '1px solid var(--border-color)'
          }}
        >
          Deposits
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-6 py-2 rounded-xl text-sm font-medium transition-colors`}
          style={{
            backgroundColor: activeTab === 'withdrawals' ? '#ef4444' : 'var(--bg-card)',
            color: activeTab === 'withdrawals' ? '#ffffff' : 'var(--text-secondary)',
            border: activeTab === 'withdrawals' ? 'none' : '1px solid var(--border-color)'
          }}
        >
          Withdrawals
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-xl text-sm focus:outline-none"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="failed">Failed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button 
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Table */}
      <div 
        className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-hover)' }}>
                <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>ID</th>
                <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>User</th>
                <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Amount</th>
                <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Method</th>
                <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status</th>
                <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Date</th>
                <th className="text-left py-4 px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center">
                    <Loader2 className="animate-spin mx-auto" size={24} style={{ color: 'var(--text-muted)' }} />
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    No {activeTab} found
                  </td>
                </tr>
              ) : filteredData.map((item) => {
                const statusStyle = getStatusStyle(item.status)
                const StatusIcon = statusStyle.icon
                return (
                  <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-4 px-4 text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{item.reference || item._id?.slice(-8)}</td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.user?.firstName} {item.user?.lastName}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.user?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold" style={{ color: activeTab === 'deposits' ? '#22c55e' : '#ef4444' }}>
                      {activeTab === 'deposits' ? '+' : '-'}${(item.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>{item.paymentMethod || item.withdrawalMethod || 'N/A'}</td>
                    <td className="py-4 px-4">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit capitalize"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                      >
                        <StatusIcon size={12} />
                        {item.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelectedTx(item); setShowDetailModal(true); }} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-hover)' }} title="View Details">
                          <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        {item.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(item)} disabled={actionLoading === item._id} className="p-2 rounded-lg disabled:opacity-50" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }} title="Approve">
                              {actionLoading === item._id ? <Loader2 className="animate-spin" size={16} style={{ color: '#22c55e' }} /> : <CheckCircle size={16} style={{ color: '#22c55e' }} />}
                            </button>
                            <button onClick={() => { setSelectedTx(item); setShowRejectModal(true); }} className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }} title="Reject">
                              <XCircle size={16} style={{ color: '#ef4444' }} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{selectedTx.type} Details</h3>
              <button onClick={() => { setShowDetailModal(false); setSelectedTx(null); }}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Amount</p>
                  <p className="text-xl font-bold" style={{ color: selectedTx.type === 'deposit' ? '#22c55e' : '#ef4444' }}>${selectedTx.amount?.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Status</p>
                  <p className="text-xl font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{selectedTx.status}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>User</p>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedTx.user?.firstName} {selectedTx.user?.lastName}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedTx.user?.email}</p>
              </div>

              {selectedTx.type === 'deposit' && (
                <>
                  {selectedTx.utrNumber && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>UTR Number</p>
                      <p className="font-mono" style={{ color: 'var(--text-primary)' }}>{selectedTx.utrNumber}</p>
                    </div>
                  )}
                  {selectedTx.transactionId && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Transaction ID</p>
                      <p className="font-mono" style={{ color: 'var(--text-primary)' }}>{selectedTx.transactionId}</p>
                    </div>
                  )}
                  {selectedTx.screenshot && (
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Payment Screenshot</p>
                      <img src={selectedTx.screenshot} alt="Payment Screenshot" className="w-full rounded-lg" />
                    </div>
                  )}
                </>
              )}

              {selectedTx.type === 'withdrawal' && selectedTx.withdrawalDetails && (
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Withdrawal To</p>
                  {selectedTx.withdrawalDetails.bankName && <p style={{ color: 'var(--text-primary)' }}>{selectedTx.withdrawalDetails.bankName}</p>}
                  {selectedTx.withdrawalDetails.accountNumber && <p className="font-mono" style={{ color: 'var(--text-secondary)' }}>A/C: {selectedTx.withdrawalDetails.accountNumber}</p>}
                  {selectedTx.withdrawalDetails.ifscCode && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>IFSC: {selectedTx.withdrawalDetails.ifscCode}</p>}
                  {selectedTx.withdrawalDetails.upiId && <p className="font-mono" style={{ color: 'var(--text-secondary)' }}>UPI: {selectedTx.withdrawalDetails.upiId}</p>}
                </div>
              )}

              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Date</p>
                <p style={{ color: 'var(--text-primary)' }}>{new Date(selectedTx.createdAt).toLocaleString()}</p>
              </div>

              {selectedTx.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button onClick={() => { handleApprove(selectedTx); setShowDetailModal(false); }} className="flex-1 py-3 rounded-xl font-medium text-white bg-green-500 hover:bg-green-600">Approve</button>
                  <button onClick={() => { setShowDetailModal(false); setShowRejectModal(true); }} className="flex-1 py-3 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600">Reject</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Reject {selectedTx.type}</h3>
              <button onClick={() => { setShowRejectModal(false); setSelectedTx(null); setRejectReason(''); }}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Rejecting ${selectedTx.amount?.toLocaleString()} {selectedTx.type} from {selectedTx.user?.firstName}</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl mb-4 resize-none"
              style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowRejectModal(false); setRejectReason(''); }} className="flex-1 py-3 rounded-xl font-medium" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleReject} disabled={actionLoading} className="flex-1 py-3 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50">
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FundManagement
