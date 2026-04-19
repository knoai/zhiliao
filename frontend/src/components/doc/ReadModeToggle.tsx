import React from 'react'
import { BookOpen, Pencil } from 'lucide-react'

interface ReadModeToggleProps {
  readMode: boolean
  onToggle: () => void
}

export const ReadModeToggle: React.FC<ReadModeToggleProps> = ({ readMode, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      title={readMode ? '切换为编辑模式' : '切换为阅读模式'}
    >
      {readMode ? (
        <>
          <Pencil className="w-4 h-4" />
          <span>编辑文档</span>
        </>
      ) : (
        <>
          <BookOpen className="w-4 h-4" />
          <span>阅读模式</span>
        </>
      )}
    </button>
  )
}
