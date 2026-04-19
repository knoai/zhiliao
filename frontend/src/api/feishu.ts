import request from './request'

export interface FeishuBindingStatus {
  bound: boolean
  feishu_user_name?: string
  feishu_avatar?: string
  created_at?: string
}

export const feishuApi = {
  getAuthUrl(): Promise<{ auth_url: string }> {
    return request.get('/feishu/auth-url')
  },

  callback(code: string): Promise<{ message: string; feishu_user_name: string; feishu_avatar?: string }> {
    return request.post('/feishu/callback', { code })
  },

  getBinding(): Promise<FeishuBindingStatus> {
    return request.get('/feishu/binding')
  },

  unbind(): Promise<void> {
    return request.delete('/feishu/binding')
  },
}
