import React, { useEffect, useRef } from 'react'

const MobileChart = ({ symbol }) => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: symbol.includes('USD') ? `FX:${symbol}` : symbol,
          interval: '15',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#000000',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: true,
          save_image: false,
          container_id: 'mobile-chart-container',
          backgroundColor: '#0a0e17',
          gridColor: '#1f2937',
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [symbol])

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#000000' }}>
      {/* Symbol Header */}
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <span className="text-sm font-medium" style={{ color: '#fff' }}>{symbol}</span>
        <span className="text-xs" style={{ color: '#22c55e' }}>+0.00%</span>
      </div>

      {/* Chart */}
      <div 
        id="mobile-chart-container" 
        ref={containerRef}
        className="flex-1"
        style={{ minHeight: '300px' }}
      />
    </div>
  )
}

export default MobileChart
