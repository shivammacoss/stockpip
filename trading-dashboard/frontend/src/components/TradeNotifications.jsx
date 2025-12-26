import React, { useState, useEffect, useCallback } from 'react'
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Bell,
  Target,
  Shield,
  Zap
} from 'lucide-react'
import { io } from 'socket.io-client'

const TradeNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [showDialog, setShowDialog] = useState(false)
  const [dialogData, setDialogData] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const socket = io('http://localhost:5001', {
      auth: { token }
    })

    // Join user room
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user._id) {
      socket.emit('join', `user_${user._id}`)
    }

    // Trade executed
    socket.on('orderExecuted', (data) => {
      addNotification({
        type: 'success',
        icon: <CheckCircle size={20} />,
        title: 'Order Executed',
        message: data.message,
        trade: data.trade
      })
    })

    // Pending order placed
    socket.on('orderPlaced', (data) => {
      addNotification({
        type: 'info',
        icon: <Bell size={20} />,
        title: 'Pending Order Placed',
        message: data.message,
        trade: data.trade
      })
    })

    // Pending order activated
    socket.on('pendingOrderActivated', (data) => {
      addNotification({
        type: 'success',
        icon: <Zap size={20} />,
        title: 'Pending Order Activated',
        message: data.message,
        trade: data.trade
      })
    })

    // Trade closed
    socket.on('tradeClosed', (data) => {
      const isProfit = data.pnl >= 0
      addNotification({
        type: isProfit ? 'success' : 'error',
        icon: isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />,
        title: `Trade Closed (${data.reason})`,
        message: data.message,
        trade: data.trade,
        pnl: data.pnl
      })

      // Show dialog for SL/TP/StopOut
      if (['stop_loss', 'take_profit', 'stop_out'].includes(data.reason)) {
        setDialogData({
          type: data.reason,
          trade: data.trade,
          pnl: data.pnl,
          message: data.message
        })
        setShowDialog(true)
      }
    })

    // Margin call warning
    socket.on('marginCall', (data) => {
      addNotification({
        type: 'warning',
        icon: <AlertTriangle size={20} />,
        title: '⚠️ Margin Call',
        message: data.message,
        persist: true
      })

      setDialogData({
        type: 'margin_call',
        equity: data.equity,
        marginLevel: data.marginLevel,
        message: data.message
      })
      setShowDialog(true)
    })

    // Stop out - all trades closed
    socket.on('stopOut', (data) => {
      addNotification({
        type: 'error',
        icon: <Shield size={20} />,
        title: '🛑 Stop Out',
        message: data.message,
        persist: true
      })

      setDialogData({
        type: 'stop_out',
        closedTrades: data.closedTrades,
        totalPnL: data.totalPnL,
        equity: data.equity,
        message: data.message
      })
      setShowDialog(true)
    })

    // Order cancelled
    socket.on('orderCancelled', (data) => {
      addNotification({
        type: 'info',
        icon: <XCircle size={20} />,
        title: 'Order Cancelled',
        message: data.message,
        trade: data.trade
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const addNotification = useCallback((notification) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { ...notification, id }])

    // Auto remove after 5 seconds (unless persist)
    if (!notification.persist) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, 5000)
    }
  }, [])

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return { bg: 'rgba(34, 197, 94, 0.95)', border: '#22c55e', iconColor: '#fff' }
      case 'error':
        return { bg: 'rgba(239, 68, 68, 0.95)', border: '#ef4444', iconColor: '#fff' }
      case 'warning':
        return { bg: 'rgba(251, 191, 36, 0.95)', border: '#fbbf24', iconColor: '#000' }
      case 'info':
      default:
        return { bg: 'rgba(59, 130, 246, 0.95)', border: '#3b82f6', iconColor: '#fff' }
    }
  }

  const getDialogIcon = (type) => {
    switch (type) {
      case 'stop_loss':
        return <Shield size={48} style={{ color: '#ef4444' }} />
      case 'take_profit':
        return <Target size={48} style={{ color: '#22c55e' }} />
      case 'stop_out':
        return <AlertTriangle size={48} style={{ color: '#ef4444' }} />
      case 'margin_call':
        return <AlertTriangle size={48} style={{ color: '#fbbf24' }} />
      default:
        return <Bell size={48} style={{ color: '#3b82f6' }} />
    }
  }

  return (
    <>
      {/* Notifications Stack */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {notifications.map((notification) => {
          const styles = getTypeStyles(notification.type)
          return (
            <div
              key={notification.id}
              className="rounded-xl p-4 shadow-2xl animate-slide-in flex items-start gap-3"
              style={{ 
                backgroundColor: styles.bg, 
                borderLeft: `4px solid ${styles.border}`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ color: styles.iconColor }}>
                {notification.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">{notification.title}</p>
                <p className="text-white/90 text-xs mt-1">{notification.message}</p>
                {notification.pnl !== undefined && (
                  <p className={`text-sm font-bold mt-1 ${notification.pnl >= 0 ? 'text-blue-200' : 'text-red-200'}`}>
                    P/L: {notification.pnl >= 0 ? '+' : ''}{notification.pnl.toFixed(2)} USD
                  </p>
                )}
              </div>
              <button 
                onClick={() => removeNotification(notification.id)}
                className="text-white/70 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Dialog Modal for Important Events */}
      {showDialog && dialogData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-md rounded-2xl p-6 animate-scale-in"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="text-center mb-6">
              {getDialogIcon(dialogData.type)}
              <h2 className="text-xl font-bold mt-4" style={{ color: 'var(--text-primary)' }}>
                {dialogData.type === 'stop_loss' && '🛡️ Stop Loss Triggered'}
                {dialogData.type === 'take_profit' && '🎯 Take Profit Hit'}
                {dialogData.type === 'stop_out' && '🛑 Stop Out - All Positions Closed'}
                {dialogData.type === 'margin_call' && '⚠️ Margin Call Warning'}
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              {dialogData.trade && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: 'var(--text-muted)' }}>Symbol</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{dialogData.trade.symbol}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: 'var(--text-muted)' }}>Type</span>
                    <span className={`font-semibold ${dialogData.trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                      {dialogData.trade.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span style={{ color: 'var(--text-muted)' }}>Entry Price</span>
                    <span style={{ color: 'var(--text-primary)' }}>{dialogData.trade.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Close Price</span>
                    <span style={{ color: 'var(--text-primary)' }}>{dialogData.trade.closePrice}</span>
                  </div>
                </div>
              )}

              {dialogData.pnl !== undefined && (
                <div 
                  className="p-4 rounded-xl text-center"
                  style={{ 
                    background: dialogData.pnl >= 0 
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                    border: `1px solid ${dialogData.pnl >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Profit / Loss</p>
                  <p className={`text-3xl font-bold ${dialogData.pnl >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                    {dialogData.pnl >= 0 ? '+' : ''}{dialogData.pnl.toFixed(2)} USD
                  </p>
                </div>
              )}

              {dialogData.type === 'stop_out' && (
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                    {dialogData.closedTrades?.length || 0} trades were automatically closed
                  </p>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Total P/L</span>
                    <span className={`font-bold ${dialogData.totalPnL >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                      {dialogData.totalPnL >= 0 ? '+' : ''}{dialogData.totalPnL?.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              )}

              {dialogData.type === 'margin_call' && (
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    Your margin level is critically low at <strong>{dialogData.marginLevel}%</strong>
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Deposit funds or close positions to avoid automatic liquidation.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDialog(false)}
              className="w-full py-3 rounded-xl font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  )
}

export default TradeNotifications
