import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AppLayout from './layouts/AppLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RequestPage from './pages/RequestPage'
import TrackingPage from './pages/TrackingPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import UtilityPage from './pages/UtilityPage'

const Protected = ({ children, roles }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(profile?.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/track/:trackingCode" element={<TrackingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/promotions" element={<UtilityPage type="promotions" />} />
          <Route path="/support" element={<UtilityPage type="support" />} />
          <Route path="/about" element={<UtilityPage type="about" />} />
          <Route path="/payments" element={<UtilityPage type="payments" />} />
          <Route
            path="/dashboard"
            element={
              <Protected roles={['customer', 'admin']}>
                <DashboardPage />
              </Protected>
            }
          />
          <Route
            path="/admin"
            element={
              <Protected roles={['admin']}>
                <AdminPage />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
