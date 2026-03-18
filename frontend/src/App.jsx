import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages (to be created)
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorsList from './pages/DoctorsList';
import VideoSession from './pages/VideoSession';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          
          <main style={{ padding: '2rem 0', minHeight: 'calc(100vh - 70px)' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/doctors" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/doctors" element={<DoctorsList />} />

              {/* Protected Routes - Any Authenticated User */}
              <Route element={<ProtectedRoute />}>
                <Route path="/session/:appointmentId" element={<VideoSession />} />
              </Route>

              {/* Protected Routes - Patient Only */}
              <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
                <Route path="/dashboard" element={<PatientDashboard />} />
              </Route>

              {/* Protected Routes - Doctor Only */}
              <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
                <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
              </Route>
              
              <Route path="*" element={
                <div className="empty-state">
                  <h2>404 - Page Not Found</h2>
                </div>
              } />
            </Routes>
          </main>
        </div>

        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)'
            },
            success: { iconTheme: { primary: 'var(--color-success)', secondary: '#fff' } },
            error: { iconTheme: { primary: 'var(--color-danger)', secondary: '#fff' } }
          }} 
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
