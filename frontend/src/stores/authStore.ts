import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/api/auth'
import type { User, LoginData, RegisterData } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setToken: (token: string) => void
  clearAuth: () => void
  login: (data: LoginData) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  fetchUser: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // 从 localStorage 检查是否有 token
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const hasToken = !!savedToken
      
      return {
        user: null,
        token: savedToken,
        isLoading: false,
        isAuthenticated: hasToken, // 如果有 token，初始状态为已认证

        setToken: (token: string) => {
          localStorage.setItem('token', token)
          set({ token, isAuthenticated: true })
        },

        clearAuth: () => {
          localStorage.removeItem('token')
          set({ user: null, token: null, isAuthenticated: false })
        },

        login: async (data: LoginData) => {
          set({ isLoading: true })
          try {
            console.log('开始登录:', data.email)
            const res = await authApi.login(data)
            console.log('登录成功:', res)
            localStorage.setItem('token', res.access_token)
            set({
              user: res.user,
              token: res.access_token,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          } catch (error: any) {
            console.error('登录失败:', error)
            console.error('错误详情:', error.response?.data)
            set({ isLoading: false })
            throw error
          }
        },

        register: async (data: RegisterData) => {
          set({ isLoading: true })
          try {
            const res = await authApi.register(data)
            localStorage.setItem('token', res.access_token)
            set({
              user: res.user,
              token: res.access_token,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          } catch (error) {
            set({ isLoading: false })
            throw error
          }
        },

        fetchUser: async () => {
          const token = localStorage.getItem('token')
          if (!token) return
          
          try {
            const user = await authApi.getMe()
            set({ user, token, isAuthenticated: true })
          } catch {
            get().clearAuth()
          }
        },

        logout: () => {
          get().clearAuth()
        },
      }
    },
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
