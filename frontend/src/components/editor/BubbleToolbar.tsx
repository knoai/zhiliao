import React, { useEffect, useRef, useState } from 'react'
import { useSlate, ReactEditor } from 'slate-react'
import { Editor, Range } from 'slate'
import { Bold, Italic, Underline, Code, Link, Highlighter } from 'lucide-react'
import { toggleMark, isMarkActive } from './utils'
import type { CustomText } from './custom-types'

interface ToolbarButtonProps {
  icon: React.ReactNode
  isActive?: boolean
  onClick: () => void
  title: string
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, isActive, onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`
      p-1.5 rounded-md transition-colors
      ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}
    `}
  >
    {icon}
  </button>
)

export const BubbleToolbar: React.FC = () => {
  const editor = useSlate()
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const { selection } = editor
    if (!selection || Range.isCollapsed(selection) || Editor.string(editor, selection) === '') {
      el.style.opacity = '0'
      el.style.pointerEvents = 'none'
      setVisible(false)
      return
    }

    const domSelection = window.getSelection()
    if (!domSelection || domSelection.rangeCount === 0) return

    const domRange = domSelection.getRangeAt(0)
    const rect = domRange.getBoundingClientRect()

    // 使用 requestAnimationFrame 确保在布局完成后定位
    requestAnimationFrame(() => {
      if (!el) return
      const elRect = el.getBoundingClientRect()
      let top = rect.top - elRect.height - 8
      let left = rect.left + rect.width / 2 - elRect.width / 2

      // 边界检测：避免超出视口
      if (left < 8) left = 8
      if (left + elRect.width > window.innerWidth - 8) {
        left = window.innerWidth - elRect.width - 8
      }
      if (top < 8) {
        top = rect.bottom + 8 // 如果上方空间不足，显示在下方
      }

      el.style.top = `${top}px`
      el.style.left = `${left}px`
      el.style.opacity = '1'
      el.style.pointerEvents = 'auto'
      setVisible(true)
    })
  })

  const handleToggleMark = (format: keyof CustomText) => {
    toggleMark(editor, format)
    // 保持选区不被丢失
    ReactEditor.focus(editor)
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-high px-2 py-1.5 flex items-center gap-0.5 transition-opacity duration-150"
      style={{ opacity: 0, pointerEvents: 'none' }}
      onMouseDown={(e) => e.preventDefault()} // 防止点击工具栏时丢失选区
    >
      <ToolbarButton
        icon={<Bold size={16} />}
        isActive={isMarkActive(editor, 'bold')}
        onClick={() => handleToggleMark('bold')}
        title="加粗"
      />
      <ToolbarButton
        icon={<Italic size={16} />}
        isActive={isMarkActive(editor, 'italic')}
        onClick={() => handleToggleMark('italic')}
        title="斜体"
      />
      <ToolbarButton
        icon={<Underline size={16} />}
        isActive={isMarkActive(editor, 'underline')}
        onClick={() => handleToggleMark('underline')}
        title="下划线"
      />
      <ToolbarButton
        icon={<Code size={16} />}
        isActive={isMarkActive(editor, 'code')}
        onClick={() => handleToggleMark('code')}
        title="行内代码"
      />
      <div className="w-px h-4 bg-gray-200 mx-1" />
      <ToolbarButton
        icon={<Highlighter size={16} />}
        isActive={isMarkActive(editor, 'bold')}
        onClick={() => handleToggleMark('bold')}
        title="高亮"
      />
    </div>
  )
}
