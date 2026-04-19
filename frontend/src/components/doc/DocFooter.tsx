import React from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface DocFooterProps {
  author: string
  createdAt?: string
  updatedAt?: string
  wordCount?: number
}

export const DocFooter: React.FC<DocFooterProps> = ({
  author,
  createdAt,
  updatedAt,
  wordCount,
}) => {
  return (
    <div className="mt-16 pt-6 border-t border-gray-100">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
        <span>{author}</span>
        {createdAt && (
          <span>创建于 {format(new Date(createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
        )}
        {updatedAt && (
          <span>更新于 {format(new Date(updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
        )}
        {typeof wordCount === 'number' && <span>{wordCount.toLocaleString()} 字</span>}
      </div>
    </div>
  )
}
