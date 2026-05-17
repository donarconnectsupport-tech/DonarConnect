import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { OrderProvider } from './hooks/useOrderForm.jsx'
import HomePage from './pages/HomePage'
import PersonalDetailsPage from './pages/PersonalDetailsPage'
import OrderPage from './pages/OrderPage'
import PaymentPage from './pages/PaymentPage'
import ConfirmationPage from './pages/ConfirmationPage'

function App() {
  return (
    <Router>
      <OrderProvider>
        <div className="app-container">
          <Routes>
            <Route path="/"             element={<HomePage />} />
            <Route path="/details"      element={<PersonalDetailsPage />} />
            <Route path="/order"        element={<OrderPage />} />
            <Route path="/payment"      element={<PaymentPage />} />
            <Route path="/confirmation" element={<ConfirmationPage />} />
          </Routes>
        </div>
      </OrderProvider>
    </Router>
  )
}

export default App
