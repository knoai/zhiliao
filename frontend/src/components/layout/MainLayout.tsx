import React, { useState, useRef, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import {
  FileText,
  BookOpen,
  LayoutDashboard,
  ChevronDown,
  LogOut,
  User,
  Sparkles,
  Settings,
  HelpCircle,
} from 'lucide-react'

export const MainLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 判断当前是云文档还是云书籍
  const isDocs = location.pathname.startsWith('/docs')
  const isBooks = location.pathname.startsWith('/books')
  const isWorkspace = location.pathname === '/workspace'
  
  // 判断是否在编辑页面（文档或书籍的新建/编辑页面不显示顶部导航）
  const isEditPage = location.pathname === '/books/new' ||
    location.pathname.startsWith('/docs/') ||
    (location.pathname.startsWith('/books/') && location.pathname !== '/books/' && location.pathname !== '/books')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => {
    if (path === '/workspace') {
      return location.pathname === '/workspace'
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Navigation - 在编辑页面不显示 */}
      {!isEditPage && (
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 h-14">
            {/* Left: Logo & Nav */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <button
                onClick={() => navigate('/workspace')}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold hidden sm:block">知了云笔记</span>
              </button>

              {/* Nav Links */}
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => navigate('/workspace')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isWorkspace
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">工作台</span>
                </button>

                <button
                  onClick={() => navigate('/docs')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isDocs
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">云文档</span>
                </button>

                <button
                  onClick={() => navigate('/books')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isBooks
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">云书籍</span>
                </button>
              </nav>
            </div>

            {/* Right: Actions & User */}
            <div className="flex items-center gap-2">
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user?.username}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{user?.username}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate('/workspace')
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      工作台
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate('/settings')
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      账号设置
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <HelpCircle className="w-4 h-4" />
                      帮助与反馈
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

    </div>
  )
}

