import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Link2, Unlink, User } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../components/ui/Toast'
import { useFeishuBinding, useFeishuCallback, useFeishuUnbind } from '../hooks/useFeishu'
import { feishuApi } from '../api/feishu'

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { show } = useToast()

  const { data: binding, isLoading: loading } = useFeishuBinding()
  const feishuCallback = useFeishuCallback()
  const feishuUnbind = useFeishuUnbind()
  const [actionLoading, setActionLoading] = useState(false)

  // 处理飞书回调 code
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setActionLoading(true)
      feishuCallback
        .mutateAsync(code)
        .then((res) => {
          show(res.message, 'success')
        })
        .catch((err) => {
          show(err?.response?.data?.detail || '绑定失败', 'error')
        })
        .finally(() => {
          setActionLoading(false)
          setSearchParams({}, { replace: true })
        })
    }
  }, [searchParams])

  const handleBind = async () => {
    try {
      const { auth_url } = await feishuApi.getAuthUrl()
      window.location.href = auth_url
    } catch (err: any) {
      show(err?.response?.data?.detail || '获取授权链接失败', 'error')
    }
  }

  const handleUnbind = async () => {
    if (!confirm('确定要解除飞书账号绑定吗？')) return
    setActionLoading(true)
    try {
      await feishuUnbind.mutateAsync()
    } catch (err: any) {
      show(err?.response?.data?.detail || '解绑失败', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">个人信息</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <div className="text-base font-medium text-slate-900">{user?.username}</div>
              <div className="text-sm text-slate-500">{user?.email}</div>
            </div>
          </div>
        </div>

        {/* 飞书集成卡片 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">飞书集成</h2>

          {loading ? (
            <div className="flex items-center gap-2 text-slate-500 py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              加载中...
            </div>
          ) : binding?.bound ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {binding.feishu_avatar ? (
                  <img
                    src={binding.feishu_avatar}
                    alt="avatar"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                )}
                <div>
                  <div className="text-base font-medium text-slate-900">
                    {binding.feishu_user_name || '飞书用户'}
                  </div>
                  <div className="text-sm text-slate-500">已绑定飞书账号</div>
                </div>
              </div>
              <button
                onClick={handleUnbind}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlink className="w-4 h-4" />
                )}
                解除绑定
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-slate-600">
                绑定飞书账号后，可一键同步飞书云文档到知了云文档。
              </div>
              <button
                onClick={handleBind}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                绑定飞书账号
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
