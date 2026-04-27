import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { FileText, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, register, isLoading } = useAuthStore()
  const [isRegister, setIsRegister] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isRegister && formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    try {
      let success
      if (isRegister) {
        success = await register({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        })
      } else {
        success = await login({ email: formData.email, password: formData.password })
      }

      if (success) {
        navigate('/workspace')
      }
    } catch (err: any) {
      const message = err?.response?.data?.detail || ''
      if (message.includes('该邮箱尚未注册')) {
        setError('该邮箱尚未注册，请检查或前往注册')
      } else if (message.includes('密码错误')) {
        setError('密码错误，请重新输入')
      } else if (message.includes('审核中')) {
        setError('账号正在审核中，请等待管理员审核通过后再登录')
      } else if (message.includes('已被注册')) {
        setError('该邮箱已被注册，请直接登录')
      } else {
        setError(isRegister ? '注册失败，请检查信息' : '登录失败，请检查邮箱和密码')
      }
    }
  }

  const toggleMode = () => {
    setIsRegister(!isRegister)
    setError('')
    setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative w-full max-w-md px-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 p-8 border border-white/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">知了云文档</h1>
            <p className="text-gray-500 mt-1">个人版云端知识库</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                邮箱
              </label>
              <input
                type="email"
                required
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] outline-none disabled:bg-gray-50 transition-all bg-gray-50/50 hover:bg-white"
                placeholder="请输入邮箱"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Username (register only) */}
            <div
              className={`space-y-1.5 overflow-hidden transition-all duration-300 ${
                isRegister ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <label className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <input
                type="text"
                required={isRegister}
                disabled={isLoading}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] outline-none disabled:bg-gray-50 transition-all bg-gray-50/50 hover:bg-white"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] outline-none disabled:bg-gray-50 transition-all bg-gray-50/50 hover:bg-white"
                  placeholder="请输入密码（至少6位）"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (register only) */}
            <div
              className={`space-y-1.5 overflow-hidden transition-all duration-300 ${
                isRegister ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <label className="block text-sm font-medium text-gray-700">
                确认密码
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required={isRegister}
                  minLength={6}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] outline-none disabled:bg-gray-50 transition-all bg-gray-50/50 hover:bg-white"
                  placeholder="请再次输入密码"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                isRegister ? '注册' : '登录'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline underline-offset-4 transition-colors"
            >
              {isRegister ? '已有账号？去登录' : '还没有账号？去注册'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-6">
          知了云笔记 · 构建你的知识体系
        </p>
      </div>
    </div>
  )
}
