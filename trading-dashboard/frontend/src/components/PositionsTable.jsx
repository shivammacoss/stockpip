import React, { useState, useEffect, useCallback } from 'react'
import { Edit2, X, ChevronDown, Loader2, XCircle } from 'lucide-react'
import axios from 'axios'
import { io } from 'socket.io-client'

const PositionsTable = () => {
  const [activeTab, setActiveTab] = useState('positions')
  const [positions, setPositions] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [prices, setPrices] = useState({})
  const [closingTrade, setClosingTrade] = useState(null)
  const [modifyingTrade, setModifyingTrade] = useState(null)
  const [modifyForm, setModifyForm] = useState({ stopLoss: '', takeProfit: '' })
  const [showCloseDialog, setShowCloseDialog] = useState(null) // Trade to confirm close
  
  const styles = {
    container: { backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' },
    border: { borderColor: 'var(--border-color)' },
    text: { color: 'var(--text-primary)' },
    textSecondary: { color: 'var(--text-secondary)' },
  }

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  })

  useEffect(() => {
    fetchPositions()
    fetchPrices()
    
    // Set up socket for real-time price updates
    const token = localStorage.getItem('token')
    if (!token) return

    const socket = io('http://localhost:5001', { auth: { token } })
    
    socket.on('priceUpdate', (newPrices) => {
      setPrices(newPrices)
    })

    // Join user room for instant updates
    socket.on('connect', () => {
      console.log('[PositionsTable] Socket connected, joining user room')
    })

    // Refresh on trade events - instant updates
    socket.on('tradeClosed', (data) => {
      console.log('[PositionsTable] Trade closed:', data)
      fetchPositions()
    })
    socket.on('orderExecuted', (data) => {
      console.log('[PositionsTable] Order executed:', data)
      fetchPositions()
    })
    socket.on('pendingOrderActivated', (data) => {
      console.log('[PositionsTable] Pending order activated:', data)
      fetchPositions()
    })
    socket.on('orderCancelled', (data) => {
      console.log('[PositionsTable] Order cancelled:', data)
      fetchPositions()
    })
    socket.on('orderPlaced', (data) => {
      console.log('[PositionsTable] Order placed:', data)
      fetchPositions()
    })
    socket.on('stopOut', (data) => {
      console.log('[PositionsTable] Stop out:', data)
      fetchPositions()
    })

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      fetchPrices()
    }, 2000)

    // Listen for custom trade events from OrderPanel
    const handleTradeCreated = () => {
      console.log('[PositionsTable] Trade created event received')
      fetchPositions()
    }
    window.addEventListener('tradeCreated', handleTradeCreated)

    return () => {
      socket.disconnect()
      clearInterval(interval)
      window.removeEventListener('tradeCreated', handleTradeCreated)
    }
  }, [])

  const fetchPositions = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await axios.get('/api/trades', getAuthHeader())
      if (res.data.success) {
        const trades = res.data.data?.trades || res.data.data || []
        setPositions(trades.filter(t => t.status === 'open'))
        setPendingOrders(trades.filter(t => t.status === 'pending'))
        setHistory(trades.filter(t => t.status === 'closed').slice(0, 20))
      }
    } catch (err) {
      console.error('Failed to fetch positions:', err)
      setPositions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPrices = async () => {
    try {
      const res = await axios.get('/api/trades/prices', getAuthHeader())
      if (res.data.success) {
        setPrices(res.data.data)
      }
    } catch (err) {
      // Silent fail for price updates
    }
  }

  const closeTrade = async (tradeId) => {
    try {
      setClosingTrade(tradeId)
      const res = await axios.put(`/api/trades/${tradeId}/close`, {}, getAuthHeader())
      if (res.data.success) {
        fetchPositions()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close trade')
    } finally {
      setClosingTrade(null)
    }
  }

  const cancelOrder = async (tradeId) => {
    try {
      setClosingTrade(tradeId)
      const res = await axios.put(`/api/trades/${tradeId}/cancel`, {}, getAuthHeader())
      if (res.data.success) {
        fetchPositions()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order')
    } finally {
      setClosingTrade(null)
    }
  }

  const modifyTrade = async (tradeId) => {
    try {
      const res = await axios.put(`/api/trades/${tradeId}/modify`, {
        stopLoss: modifyForm.stopLoss ? parseFloat(modifyForm.stopLoss) : null,
        takeProfit: modifyForm.takeProfit ? parseFloat(modifyForm.takeProfit) : null
      }, getAuthHeader())
      if (res.data.success) {
        setModifyingTrade(null)
        fetchPositions()
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to modify trade')
    }
  }

  const calculatePnL = (trade) => {
    const price = prices[trade.symbol]
    if (!price) return trade.profit || 0
    
    const currentPrice = trade.type === 'buy' ? price.bid : price.ask
    const priceDiff = trade.type === 'buy' 
      ? currentPrice - trade.price 
      : trade.price - currentPrice
    
    // Simplified P&L calculation
    let contractSize = 100000
    if (trade.symbol.includes('XAU')) contractSize = 100
    else if (trade.symbol.includes('XAG')) contractSize = 5000
    else if (trade.symbol.includes('BTC') || trade.symbol.includes('ETH')) contractSize = 1
    
    return priceDiff * trade.amount * contractSize
  }

  const getCurrentPrice = (trade) => {
    const price = prices[trade.symbol]
    if (!price) return trade.price
    return trade.type === 'buy' ? price.bid : price.ask
  }
  
  const tabs = [
    { id: 'positions', label: 'Positions', count: positions.length },
    { id: 'pending', label: 'Pending', count: pendingOrders.length },
    { id: 'history', label: 'History 24H', count: history.length },
    { id: 'cancelled', label: 'Cancelled 24H', count: 0 },
  ]

  // Calculate live total P&L
  const totalPnL = positions.reduce((sum, pos) => sum + calculatePnL(pos), 0)

  return (
    <div className="h-48 flex flex-col transition-colors" style={styles.container}>
      {/* Tabs */}
      <div 
        className="flex items-center justify-between px-4"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-3 text-sm font-medium transition-colors"
              style={{ 
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-green)' : '2px solid transparent'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Floating P/L:
          </span>
          <span 
            className="text-sm font-bold"
            style={{ color: totalPnL >= 0 ? '#3b82f6' : 'var(--accent-red)' }}
          >
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* Table Header */}
      <div 
        className="grid grid-cols-12 gap-2 px-4 py-2 text-xs"
        style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
      >
        <div>Time</div>
        <div>Symbol</div>
        <div>Side</div>
        <div>Lots</div>
        <div>Entry</div>
        <div>Current</div>
        <div>SL</div>
        <div>TP</div>
        <div>Charges</div>
        <div>Spread</div>
        <div>P/L</div>
        <div></div>
      </div>
      
      {/* Table Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin" size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : activeTab === 'positions' && positions.length > 0 ? (
          positions.map(pos => {
            const pnl = calculatePnL(pos)
            const currentPrice = getCurrentPrice(pos)
            return (
              <div 
                key={pos._id}
                className="grid grid-cols-12 gap-2 px-4 py-2 text-sm items-center transition-colors"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ color: 'var(--text-secondary)' }}>{new Date(pos.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{pos.symbol}</div>
                <div>
                  <span 
                    className="px-2 py-0.5 rounded text-xs font-medium uppercase"
                    style={{ 
                      backgroundColor: pos.type === 'buy' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: pos.type === 'buy' ? 'var(--accent-green)' : 'var(--accent-red)'
                    }}
                  >
                    {pos.type}
                  </span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>{(pos.amount || 0).toFixed(2)}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{pos.price?.toFixed(5)}</div>
                <div style={{ color: 'var(--text-primary)' }}>{currentPrice?.toFixed(5)}</div>
                <div style={{ color: pos.stopLoss ? '#ef4444' : 'var(--text-muted)' }}>{pos.stopLoss || '-'}</div>
                <div style={{ color: pos.takeProfit ? '#22c55e' : 'var(--text-muted)' }}>{pos.takeProfit || '-'}</div>
                <div style={{ color: 'var(--text-muted)' }}>${(pos.fee || 0).toFixed(2)}</div>
                <div style={{ color: '#fbbf24' }}>{pos.spread || '-'}</div>
                <div 
                  className="font-medium"
                  style={{ color: pnl >= 0 ? '#3b82f6' : 'var(--accent-red)' }}
                >
                  {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setModifyingTrade(pos)
                      setModifyForm({ stopLoss: pos.stopLoss || '', takeProfit: pos.takeProfit || '' })
                    }}
                    className="transition-colors hover:opacity-70"
                    style={{ color: 'var(--text-secondary)' }}
                    title="Modify SL/TP"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => setShowCloseDialog(pos)}
                    disabled={closingTrade === pos._id}
                    className="transition-colors hover:text-red-500"
                    style={{ color: 'var(--text-secondary)' }}
                    title="Close Trade"
                  >
                    {closingTrade === pos._id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  </button>
                </div>
              </div>
            )
          })
        ) : activeTab === 'pending' && pendingOrders.length > 0 ? (
          pendingOrders.map(order => (
            <div 
              key={order._id}
              className="grid grid-cols-12 gap-2 px-4 py-2 text-sm items-center transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ color: 'var(--text-secondary)' }}>{new Date(order.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{order.symbol}</div>
              <div>
                <span 
                  className="px-2 py-0.5 rounded text-xs font-medium uppercase"
                  style={{ 
                    backgroundColor: order.type === 'buy' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: order.type === 'buy' ? 'var(--accent-green)' : 'var(--accent-red)'
                  }}
                >
                  {order.type}
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>{(order.amount || 0).toFixed(2)}</div>
              <div style={{ color: '#fbbf24' }}>{order.price?.toFixed(5)} ({order.orderType})</div>
              <div style={{ color: 'var(--text-muted)' }}>-</div>
              <div style={{ color: order.stopLoss ? '#ef4444' : 'var(--text-muted)' }}>{order.stopLoss || '-'}</div>
              <div style={{ color: order.takeProfit ? '#22c55e' : 'var(--text-muted)' }}>{order.takeProfit || '-'}</div>
              <div style={{ color: 'var(--text-muted)' }}>${(order.fee || 0).toFixed(2)}</div>
              <div style={{ color: '#fbbf24' }}>{order.spread || '-'}</div>
              <div style={{ color: 'var(--text-muted)' }}>Pending</div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => cancelOrder(order._id)}
                  disabled={closingTrade === order._id}
                  className="transition-colors hover:text-red-500"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Cancel Order"
                >
                  {closingTrade === order._id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                </button>
              </div>
            </div>
          ))
        ) : activeTab === 'history' && history.length > 0 ? (
          history.map(trade => (
            <div 
              key={trade._id}
              className="grid grid-cols-12 gap-2 px-4 py-2 text-sm items-center transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ color: 'var(--text-secondary)' }}>{new Date(trade.closedAt || trade.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{trade.symbol}</div>
              <div>
                <span 
                  className="px-2 py-0.5 rounded text-xs font-medium uppercase"
                  style={{ 
                    backgroundColor: trade.type === 'buy' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: trade.type === 'buy' ? 'var(--accent-green)' : 'var(--accent-red)'
                  }}
                >
                  {trade.type}
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>{(trade.amount || 0).toFixed(2)}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{trade.price?.toFixed(5)}</div>
              <div style={{ color: 'var(--text-primary)' }}>{trade.closePrice?.toFixed(5)}</div>
              <div style={{ color: 'var(--text-muted)' }}>{trade.stopLoss || '-'}</div>
              <div style={{ color: 'var(--text-muted)' }}>{trade.takeProfit || '-'}</div>
              <div style={{ color: 'var(--text-muted)' }}>${(trade.fee || 0).toFixed(2)}</div>
              <div style={{ color: '#fbbf24' }}>{trade.spread || '-'}</div>
              <div 
                className="font-medium"
                style={{ color: (trade.profit || 0) >= 0 ? '#3b82f6' : 'var(--accent-red)' }}
              >
                {(trade.profit || 0) >= 0 ? '+' : ''}${(trade.profit || 0).toFixed(2)}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {trade.closeReason || 'manual'}
              </div>
            </div>
          ))
        ) : (
          <div 
            className="flex items-center justify-center h-full"
            style={{ color: 'var(--text-muted)' }}
          >
            No {activeTab === 'positions' ? 'open positions' : activeTab === 'pending' ? 'pending orders' : 'history'}
          </div>
        )}
      </div>

      {/* Modify SL/TP Modal */}
      {modifyingTrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-2xl p-6 w-80" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Modify {modifyingTrade.symbol}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Stop Loss</label>
                <input
                  type="number"
                  step="0.00001"
                  value={modifyForm.stopLoss}
                  onChange={(e) => setModifyForm({ ...modifyForm, stopLoss: e.target.value })}
                  placeholder="Leave empty to remove"
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Take Profit</label>
                <input
                  type="number"
                  step="0.00001"
                  value={modifyForm.takeProfit}
                  onChange={(e) => setModifyForm({ ...modifyForm, takeProfit: e.target.value })}
                  placeholder="Leave empty to remove"
                  className="w-full px-3 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModifyingTrade(null)}
                  className="flex-1 py-2 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => modifyTrade(modifyingTrade._id)}
                  className="flex-1 py-2 rounded-lg text-white"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Trade Confirmation Dialog */}
      {showCloseDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Close Trade
            </h3>
            <div className="mb-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
              <div className="flex justify-between mb-2">
                <span style={{ color: 'var(--text-muted)' }}>Symbol</span>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{showCloseDialog.symbol}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span style={{ color: 'var(--text-muted)' }}>Type</span>
                <span className="uppercase" style={{ color: showCloseDialog.type === 'buy' ? '#22c55e' : '#ef4444' }}>
                  {showCloseDialog.type}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span style={{ color: 'var(--text-muted)' }}>Volume</span>
                <span style={{ color: 'var(--text-primary)' }}>{showCloseDialog.amount?.toFixed(2)} lots</span>
              </div>
              <div className="flex justify-between mb-2">
                <span style={{ color: 'var(--text-muted)' }}>Entry</span>
                <span style={{ color: 'var(--text-primary)' }}>{showCloseDialog.price?.toFixed(5)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-muted)' }}>Floating P/L</span>
                <span style={{ color: calculatePnL(showCloseDialog) >= 0 ? '#22c55e' : '#ef4444' }}>
                  {calculatePnL(showCloseDialog) >= 0 ? '+' : ''}${calculatePnL(showCloseDialog).toFixed(2)}
                </span>
              </div>
            </div>
            <p className="text-sm text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to close this position at market price?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseDialog(null)}
                className="flex-1 py-3 rounded-xl font-medium"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await closeTrade(showCloseDialog._id)
                  setShowCloseDialog(null)
                }}
                disabled={closingTrade === showCloseDialog._id}
                className="flex-1 py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600"
              >
                {closingTrade === showCloseDialog._id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : null}
                Close Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PositionsTable
