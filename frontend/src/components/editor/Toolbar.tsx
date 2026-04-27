import React, { useState, useRef, useEffect } from 'react'
import { useSlate } from 'slate-react'
import { useToast } from '../ui/Toast'
import { Editor, Transforms } from 'slate'
import { 
  Bold, Italic, Underline, Code, 
  Type, List, ListOrdered, Quote, Minus, Upload
} from 'lucide-react'
import { toggleMark, toggleBlock, isMarkActive, isBlockActive } from './utils'
import type { CustomElement, CustomText } from './custom-types'
import { importFile, triggerFileSelect } from '@/utils/importUtils'

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
    aria-label={title}
    className={`
      p-2 rounded hover:bg-gray-100 transition-colors
      ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600'}
    `}
  >
    {icon}
  </button>
)

export const Toolbar: React.FC = () => {
  const editor = useSlate()
  const { show } = useToast()

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
      {/* Mark buttons */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300">
        <MarkButton format="bold" icon={<Bold size={18} />} title="加粗 (Ctrl+B)" />
        <MarkButton format="italic" icon={<Italic size={18} />} title="斜体 (Ctrl+I)" />
        <MarkButton format="underline" icon={<Underline size={18} />} title="下划线 (Ctrl+U)" />
        <MarkButton format="code" icon={<Code size={18} />} title="行内代码 (Ctrl+`)" />
      </div>

      {/* Block buttons */}
      <div className="flex items-center gap-0.5 px-2 border-r border-gray-300">
        <BlockButton format="heading-one" icon={<span className="text-sm font-bold">H1</span>} title="标题 1 (# )" />
        <BlockButton format="heading-two" icon={<span className="text-sm font-bold">H2</span>} title="标题 2 (## )" />
        <BlockButton format="heading-three" icon={<span className="text-sm font-bold">H3</span>} title="标题 3 (### )" />
      </div>

      <div className="flex items-center gap-0.5 px-2 border-r border-gray-300">
        <BlockButton format="bulleted-list" icon={<List size={18} />} title="无序列表 (- )" />
        <BlockButton format="numbered-list" icon={<ListOrdered size={18} />} title="有序列表 (1. )" />
        <BlockButton format="block-quote" icon={<Quote size={18} />} title="引用 (> )" />
      </div>

      <div className="flex items-center gap-0.5 pl-2">
        <InsertDividerButton />
        <ImportButton />
      </div>
    </div>
  )
}

interface MarkButtonProps {
  format: keyof CustomText
  icon: React.ReactNode
  title: string
}

const MarkButton: React.FC<MarkButtonProps> = ({ format, icon, title }) => {
  const editor = useSlate()
  return (
    <ToolbarButton
      icon={icon}
      isActive={isMarkActive(editor, format)}
      onClick={() => toggleMark(editor, format)}
      title={title}
    />
  )
}

interface BlockButtonProps {
  format: CustomElement['type']
  icon: React.ReactNode
  title: string
}

const BlockButton: React.FC<BlockButtonProps> = ({ format, icon, title }) => {
  const editor = useSlate()
  return (
    <ToolbarButton
      icon={icon}
      isActive={isBlockActive(editor, format)}
      onClick={() => toggleBlock(editor, format)}
      title={title}
    />
  )
}

const InsertDividerButton: React.FC = () => {
  const editor = useSlate()
  
  return (
    <ToolbarButton
      icon={<Minus size={18} />}
      onClick={() => {
        Editor.insertNode(editor, {
          type: 'divider',
          children: [{ text: '' }],
        })
        Editor.insertNode(editor, {
          type: 'paragraph',
          children: [{ text: '' }],
        })
      }}
      title="分割线 (---)"
    />
  )
}

const ImportButton: React.FC = () => {
  const editor = useSlate()
  const { show } = useToast()
  const [showMenu, setShowMenu] = useState(false)
  const [importing, setImporting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleImport = async () => {
    triggerFileSelect('.md,.txt,.markdown', async (file) => {
      setImporting(true)
      try {
        const { content } = await importFile(file)
        Transforms.insertFragment(editor, content)
        setShowMenu(false)
      } catch (err) {
        show((err as Error).message || '导入失败', 'error')
      } finally {
        setImporting(false)
      }
    })
  }

  return (
    <div className="relative" ref={menuRef}>
      <ToolbarButton
        icon={<Upload size={18} className={importing ? 'animate-spin' : ''} />}
        onClick={() => !importing && setShowMenu(!showMenu)}
        title="导入内容"
      />
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          <button
            disabled={importing}
            onClick={handleImport}
            className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? '导入中...' : '插入到光标处'}
          </button>
        </div>
      )}
    </div>
  )
}
