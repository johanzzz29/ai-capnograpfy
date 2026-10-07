import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, useTheme } from '@/app/providers/ThemeProvider'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { AppRoutes } from '@/app/router/AppRoutes'
import { Toaster } from 'sonner'

function AppToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster 
      theme={resolvedTheme} 
      richColors 
      position="top-right" 
      closeButton
      toastOptions={{
        className: '!rounded-[20px] !bg-[var(--md-sys-color-surface-container-high)] !text-[var(--md-sys-color-on-surface)] !border-[var(--md-sys-color-outline-variant)] !shadow-[var(--md-sys-elevation-level-2)]',
        style: {
          fontFamily: 'var(--md-ref-typeface-plain)',
        }
      }}
    />
  )
}

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <AppToaster />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
