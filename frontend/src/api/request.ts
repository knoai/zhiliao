import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error: AxiosError) => {
    const status = error.response?.status
    const config = error.config
    
    // 登录/注册接口的 401 不应清空 token 或强制跳转
    const isAuthEndpoint = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/register')
    
    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

export default request
