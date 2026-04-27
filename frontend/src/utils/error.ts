export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return '未知错误'
}

export function getApiErrorDetail(err: unknown): string | undefined {
  const e = err as Record<string, any>
  return e?.response?.data?.detail
}
