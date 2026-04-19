import request from './request'
import type { LoginData, RegisterData, TokenResponse, User, UserStats } from '@/types'

export const authApi = {
  login(data: LoginData): Promise<TokenResponse> {
    return request.post('/auth/login', data)
  },

  register(data: RegisterData): Promise<TokenResponse> {
    return request.post('/auth/register', data)
  },

  getMe(): Promise<User> {
    return request.get('/auth/me')
  },

  updateMe(data: Partial<User>): Promise<User> {
    return request.put('/auth/me', data)
  },

  getStats(): Promise<UserStats> {
    return request.get('/auth/stats')
  },
}
