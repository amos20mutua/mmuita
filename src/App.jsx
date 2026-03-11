import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AppLayout from './layouts/AppLayout'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RequestPage = lazy(() => import('./pages/RequestPage'))
const TrackingPage = lazy(() => import('./pages/TrackingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const RiderDashboardPage = lazy(() => import('./pages/RiderDashboardPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const UtilityPage = lazy(() => import('./pages/UtilityPage'))

const Protected = ({ children, roles }) => {
  const { user, profile, loading, profileReady } = useAuth()
  if (loading || (user && !profileReady)) return <div className="p-6">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  const role = profile?.role || 'customer'
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />
  if (role === 'rider' && !profile?.is_active) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="p-6">Loading...</div>}>
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
              path="/rider"
              element={
                <Protected roles={['rider']}>
                  <RiderDashboardPage />
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
      </Suspense>
    </AuthProvider>
  )
}
