import React, { useEffect, useRef, useState } from 'react'
import { useSlate, ReactEditor } from 'slate-react'
import { Editor, Transforms, Element as SlateElement, Range } from 'slate'
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Minus,
} from 'lucide-react'

interface SlashItem {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  shortcut?: string
  action: (editor: Editor) => void
}

const slashItems: SlashItem[] = [
  {
    key: 'heading-one',
    label: '标题 1',
    description: '大标题',
    icon: <Heading1 size={18} />,
    shortcut: '# ',
    action: (editor) => {
      Transforms.setNodes(editor, { type: 'heading-one' } as Partial<SlateElement>, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
    },
  },
  {
    key: 'heading-two',
    label: '标题 2',
    description: '中标题',
    icon: <Heading2 size={18} />,
    shortcut: '## ',
    action: (editor) => {
      Transforms.setNodes(editor, { type: 'heading-two' } as Partial<SlateElement>, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
    },
  },
  {
    key: 'heading-three',
    label: '标题 3',
    description: '小标题',
    icon: <Heading3 size={18} />,
    shortcut: '### ',
    action: (editor) => {
      Transforms.setNodes(editor, { type: 'heading-three' } as Partial<SlateElement>, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
    },
  },
  {
    key: 'bulleted-list',
    label: '无序列表',
    description: '项目符号列表',
    icon: <List size={18} />,
    shortcut: '- ',
    action: (editor) => {
      Transforms.setNodes(editor, { type: 'list-item' } as Partial<SlateElement>, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
      Transforms.wrapNodes(
        editor,
        { type: 'bulleted-list', children: [] } as SlateElement,
        {
          match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            n.type === 'list-item',
        }
      )
    },
  },
  {
    key: 'numbered-list',
    label: '有序列表',
    description: '编号列表',
    icon: <ListOrdered size={18} />,
    shortcut: '1. ',
    action: (editor) => {
      Transforms.setNodes(editor, { type: 'list-item' } as Partial<SlateElement>, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
      Transforms.wrapNodes(
        editor,
        { type: 'numbered-list', children: [] } as SlateElement,
        {
          match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            n.type === 'list-item',
        }
      )
    },
  },
  {
    key: 'block-quote',
    label: '引用',
    description: '引用块',
    icon: <Quote size={18} />,
    shortcut: '> ',
    action: (editor) => {
      Transforms.setNodes(editor, { type: 'block-quote' } as Partial<SlateElement>, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
    },
  },
  {
    key: 'code-block',
    label: '代码块',
    description: '代码片段',
    icon: <Code2 size={18} />,
    shortcut: '```',
    action: (editor) => {
      Transforms.setNodes(editor, { type: 'code-block', language: undefined } as Partial<SlateElement>, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
    },
  },
  {
    key: 'divider',
    label: '分割线',
    description: '水平分割线',
    icon: <Minus size={18} />,
    shortcut: '---',
    action: (editor) => {
      Editor.insertNode(editor, {
        type: 'divider',
        children: [{ text: '' }],
      })
      Editor.insertNode(editor, {
        type: 'paragraph',
        children: [{ text: '' }],
      })
    },
  },
]

interface SlashCommandProps {
  open: boolean
  onClose: () => void
  position: { top: number; left: number }
  filter: string
}

export const SlashCommand: React.FC<SlashCommandProps> = ({
  open,
  onClose,
  position,
  filter,
}) => {
  const editor = useSlate()
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  const filteredItems = slashItems.filter(
    (item) =>
      item.label.toLowerCase().includes(filter.toLowerCase()) ||
      item.description.toLowerCase().includes(filter.toLowerCase())
  )

  useEffect(() => {
    setIndex(0)
  }, [filter])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIndex((prev) => (prev + 1) % filteredItems.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredItems[index]) {
          applyItem(filteredItems[index])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, index, filteredItems, onClose])

  const applyItem = (item: SlashItem) => {
    // 删除已经输入的 / + filter 文本
    const { selection } = editor
    if (selection && Range.isCollapsed(selection)) {
      const start = Editor.start(editor, selection.anchor.path)
      const range = { anchor: start, focus: selection.anchor }
      const text = Editor.string(editor, range)
      const slashIndex = text.lastIndexOf('/')
      if (slashIndex !== -1) {
        const deleteRange = {
          anchor: { ...selection.anchor, offset: slashIndex },
          focus: selection.anchor,
        }
        Transforms.delete(editor, { at: deleteRange })
      }
    }

    item.action(editor)
    onClose()
    ReactEditor.focus(editor)
  }

  useEffect(() => {
    if (!open) return
    const el = ref.current
    if (!el) return

    // 边界检测
    requestAnimationFrame(() => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      let { top, left } = position
      if (left + rect.width > window.innerWidth - 8) {
        left = window.innerWidth - rect.width - 8
      }
      if (top + rect.height > window.innerHeight - 8) {
        top = top - rect.height - 24
      }
      el.style.top = `${top}px`
      el.style.left = `${left}px`
    })
  }, [open, position])

  if (!open || filteredItems.length === 0) return null

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-high py-1.5 w-56 max-h-72 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {filteredItems.map((item, i) => (
        <button
          key={item.key}
          onClick={() => applyItem(item)}
          className={`w-full px-3 py-2 flex items-center gap-3 text-left transition-colors ${
            i === index ? 'bg-gray-50' : 'hover:bg-gray-50'
          }`}
        >
          <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-gray-600 flex-shrink-0">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">{item.label}</div>
            <div className="text-xs text-gray-400">{item.description}</div>
          </div>
          {item.shortcut && (
            <span className="text-xs text-gray-300 font-mono flex-shrink-0">{item.shortcut}</span>
          )}
        </button>
      ))}
    </div>
  )
}
