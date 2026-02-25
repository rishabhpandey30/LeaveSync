import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { LeaveProvider } from './context/LeaveContext'
import { ReimbursementProvider } from './context/ReimbursementContext'
import { ThemeProvider } from './context/ThemeContext'
import App from './App.jsx'
import './index.css'

// Toaster with adaptive colours based on current theme class
const AppWithToaster = () => {
  const isDark = document.documentElement.classList.contains('dark');
  return (
    <>
      <App />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: isDark
            ? {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }
            : {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            },
          success: {
            iconTheme: { primary: '#10b981', secondary: isDark ? '#1e293b' : '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: isDark ? '#1e293b' : '#ffffff' },
          },
        }}
      />
    </>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <LeaveProvider>
            <ReimbursementProvider>
              <AppWithToaster />
            </ReimbursementProvider>
          </LeaveProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
