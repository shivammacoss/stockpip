import React, { useState } from 'react'
import AdminLayout from './AdminLayout'
import OverviewDashboard from './OverviewDashboard'
import UserManagement from './UserManagement'
import TradeManagement from './TradeManagement'
import FundManagement from './FundManagement'
import IBManagement from './IBManagement'
import ChargesManagement from './ChargesManagement'
import CopyTradeManagement from './CopyTradeManagement'
import BankSettings from './BankSettings'
import SupportManagement from './SupportManagement'

const AdminPanel = ({ initialSection = 'overview' }) => {
  const [activeSection, setActiveSection] = useState(initialSection)

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewDashboard />
      case 'users':
        return <UserManagement />
      case 'trades':
        return <TradeManagement />
      case 'funds':
        return <FundManagement />
      case 'ib':
        return <IBManagement />
      case 'charges':
        return <ChargesManagement />
      case 'copytrade':
        return <CopyTradeManagement />
      case 'bank':
        return <BankSettings />
      case 'support':
        return <SupportManagement />
      default:
        return <OverviewDashboard />
    }
  }

  return (
    <AdminLayout 
      activeSection={activeSection} 
      setActiveSection={setActiveSection}
    >
      {renderContent()}
    </AdminLayout>
  )
}

export default AdminPanel
