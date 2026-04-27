import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { feishuApi, type FeishuBindingStatus } from '../api/feishu'
import { ArrowLeft, Loader2, Link2, Unlink, User } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthStore()

  const [binding, setBinding] = useState<FeishuBindingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // 处理飞书回调 code
  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setActionLoading(true)
      feishuApi
        .callback(code)
        .then((res) => {
          alert(res.message)
          loadBinding()
        })
        .catch((err) => {
          alert(err?.response?.data?.detail || '绑定失败')
        })
        .finally(() => {
          setActionLoading(false)
          // 清除 URL 中的 code
          setSearchParams({}, { replace: true })
        })
    }
  }, [searchParams])

  const loadBinding = async () => {
    try {
      const data = await feishuApi.getBinding()
      setBinding(data)
    } catch (err) {
      console.error('加载绑定状态失败', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBinding()
  }, [])

  const handleBind = async () => {
    try {
      const { auth_url } = await feishuApi.getAuthUrl()
      window.location.href = auth_url
    } catch (err: any) {
      alert(err?.response?.data?.detail || '获取授权链接失败')
    }
  }

  const handleUnbind = async () => {
    if (!confirm('确定要解除飞书账号绑定吗？')) return
    setActionLoading(true)
    try {
      await feishuApi.unbind()
      await loadBinding()
    } catch (err: any) {
      alert(err?.response?.data?.detail || '解绑失败')
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
