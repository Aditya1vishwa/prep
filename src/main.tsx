import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import AppRouter from './routes/index.route'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="prepbuddy-theme">
      <AppRouter />
      <Toaster position="top-center" richColors closeButton />
    </ThemeProvider>
  </QueryClientProvider>
)
