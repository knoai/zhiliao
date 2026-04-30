import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from './stores/authStore'
import { HomePage } from './pages/Home'
import { WorkspacePage } from './pages/Workspace'
import { LoginPage } from './pages/Login'
import { SettingsPage } from './pages/Settings'
import { DocListPage } from './pages/DocList'
import { DocEditPage } from './pages/DocEdit'
import { BookListPage } from './pages/BookList'
import { BookEditPage } from './pages/BookEdit'
import { PublicBookReadPage } from './pages/PublicBookReadPage'
import { MainLayout } from './components/layout/MainLayout'
import { ToastProvider } from './components/ui/Toast'

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

// Public route component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/workspace" replace />
  }

  return <>{children}</>
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟
      gcTime: 1000 * 60 * 10,   // 10 分钟
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <Routes>
      {/* 首页 - 所有人可访问 */}
      <Route path="/" element={<HomePage />} />
      
      {/* 登录页 - 未登录可访问 */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* 工作台 - 需要登录 */}
      <Route
        path="/workspace"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<WorkspacePage />} />
      </Route>

      {/* 云文档 - 需要登录 */}
      <Route
        path="/docs"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DocListPage />} />
        <Route path="new" element={<DocEditPage />} />
        <Route path=":id" element={<DocEditPage />} />
      </Route>

      {/* 云书籍 - 需要登录 */}
      <Route
        path="/books"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<BookListPage />} />
        <Route path="new" element={<BookEditPage />} />
        <Route path=":id" element={<BookEditPage />} />
      </Route>

      {/* 设置页 - 需要登录 */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SettingsPage />} />
      </Route>

      {/* 公开书籍阅读页 - 无需登录 */}
      <Route path="/public/books/:id" element={<PublicBookReadPage />} />

      {/* 默认重定向 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
