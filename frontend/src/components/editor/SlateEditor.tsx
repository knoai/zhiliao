import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react'
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement, Range, Point } from 'slate'
import { Slate, Editable, withReact } from 'slate-react'
import { withHistory } from 'slate-history'
import { isHotkey } from 'is-hotkey'
import { Toolbar } from './Toolbar'
import { BubbleToolbar } from './BubbleToolbar'
import { SlashCommand } from './SlashCommand'
import { Element } from './Element'
import { Leaf } from './Leaf'
import { toggleMark } from './utils'
import { parseMarkdownToSlate, isMarkdown } from './markdownParser'
import type { CustomText } from './custom-types'

interface SlateEditorProps {
  value: Descendant[]
  onChange: (value: Descendant[]) => void
  placeholder?: string
  readOnly?: boolean
  showToolbar?: boolean
}

const HOTKEYS: Record<string, keyof CustomText> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}

const SHORTCUTS: Record<string, string> = {
  '*': 'list-item',
  '-': 'list-item',
  '+': 'list-item',
  '>': 'block-quote',
  '#': 'heading-one',
  '##': 'heading-two',
  '###': 'heading-three',
  '####': 'heading-four',
}

const addHeadingIdsToContent = (content: Descendant[]): Descendant[] => {
  let headingCount = 0

  const processNode = (node: any): any => {
    if (node.type?.startsWith('heading-')) {
      return {
        ...node,
        id: `heading-${headingCount++}`,
      }
    }
    if (node.children && Array.isArray(node.children)) {
      return {
        ...node,
        children: node.children.map(processNode),
      }
    }
    return node
  }

  return content.map(processNode)
}

const DEFAULT_VALUE: Descendant[] = [{
  type: 'paragraph',
  children: [{ text: '' }]
}]

// 深拷贝函数
const deepClone = (obj: any): any => JSON.parse(JSON.stringify(obj))

export const SlateEditor: React.FC<SlateEditorProps> = ({
  value,
  onChange,
  placeholder = '开始写作...',
  readOnly = false,
  showToolbar = true,
}) => {
  const renderElement = useCallback((props: any) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: any) => <Leaf {...props} />, [])

  // 创建编辑器实例
  const editor = useMemo(() => {
    return withShortcuts(withHistory(withReact(createEditor())))
  }, [])

  // Slash command state
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 })
  const [slashFilter, setSlashFilter] = useState('')

  // 确保 value 有效
  const safeValue = useMemo(() => {
    return value && value.length > 0 ? deepClone(value) : deepClone(DEFAULT_VALUE)
  }, [value])

  // 处理 value，添加 heading ids（仅编辑态需要）
  const processedValue = useMemo(() => {
    return addHeadingIdsToContent(safeValue)
  }, [safeValue])

  // 使用 ref 追踪初始值，避免重复设置
  const initialValueRef = useRef(processedValue)
  const isFirstRender = useRef(true)
  // 追踪编辑器最后一次通过 onChange 报告的值
  const lastEditorValueRef = useRef<Descendant[]>(processedValue)

  // 只在第一次渲染时设置初始值
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      initialValueRef.current = processedValue
      lastEditorValueRef.current = processedValue
    }
  }, [])

  // 当外部 value 变化时（如切换章节、恢复历史版本），重置编辑器内容
  useEffect(() => {
    if (!isFirstRender.current) {
      // 只有当 value 与编辑器当前值不同时才重置（避免与编辑器内部编辑冲突）
      const lastValueStr = JSON.stringify(lastEditorValueRef.current)
      const newValueStr = JSON.stringify(value)
      if (lastValueStr !== newValueStr) {
        editor.children = processedValue
        Transforms.deselect(editor)
        editor.onChange()
        lastEditorValueRef.current = processedValue
      }
    }
  }, [value]) // 只在 value 引用变化时触发

  const getSlashPosition = (): { top: number; left: number } => {
    const domSelection = window.getSelection()
    if (!domSelection || domSelection.rangeCount === 0) return { top: 0, left: 0 }
    const domRange = domSelection.getRangeAt(0)
    const rect = domRange.getBoundingClientRect()
    return { top: rect.bottom + 4, left: rect.left }
  }

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return

    // Slash command filter handling
    if (slashOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === 'Escape') {
        return // Let SlashCommand handle these
      }
      if (event.key === 'Backspace') {
        setSlashFilter((prev) => {
          const next = prev.slice(0, -1)
          if (next.length === 0 && prev.length === 0) {
            setSlashOpen(false)
          }
          return next
        })
        return
      }
      if (event.key.length === 1) {
        setSlashFilter((prev) => prev + event.key)
        return
      }
    }

    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event as any)) {
        event.preventDefault()
        const mark = HOTKEYS[hotkey]
        toggleMark(editor, mark)
        return
      }
    }

    if (event.key === 'Tab') {
      event.preventDefault()
      Transforms.insertText(editor, '  ')
    }

    if (event.key === '/' && !slashOpen) {
      const pos = getSlashPosition()
      setSlashPos(pos)
      setSlashOpen(true)
      setSlashFilter('')
    }
  }, [editor, readOnly, slashOpen])

  const onPaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    if (readOnly) return
    event.preventDefault()

    const text = event.clipboardData.getData('text/plain')

    // 检测是否为 Markdown 格式
    if (isMarkdown(text)) {
      // 解析 Markdown 为 Slate 节点
      const nodes = parseMarkdownToSlate(text)

      // 插入节点
      Transforms.insertFragment(editor, nodes)
    } else {
      // 普通文本，直接插入
      Transforms.insertText(editor, text)
    }
  }, [editor, readOnly])

  // 包装 onChange，记录编辑器当前值
  const handleEditorChange = useCallback((newValue: Descendant[]) => {
    lastEditorValueRef.current = newValue
    onChange(newValue)

    // 检测是否还在 slash command 状态
    if (slashOpen) {
      const { selection } = editor
      if (!selection || !Range.isCollapsed(selection)) {
        setSlashOpen(false)
        setSlashFilter('')
        return
      }
      const [match] = Editor.nodes(editor, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        mode: 'lowest',
      })
      if (!match) {
        setSlashOpen(false)
        setSlashFilter('')
        return
      }
      const [block] = match
      if ((block as SlateElement).type !== 'paragraph') {
        setSlashOpen(false)
        setSlashFilter('')
        return
      }
    }
  }, [onChange, editor, slashOpen])

  const closeSlash = useCallback(() => {
    setSlashOpen(false)
    setSlashFilter('')
  }, [])

  return (
    <div className="flex flex-col h-full bg-white">
      <Slate
        editor={editor}
        initialValue={initialValueRef.current}
        onChange={handleEditorChange}
      >
        {showToolbar && <BubbleToolbar />}
        <SlashCommand
          open={slashOpen}
          onClose={closeSlash}
          position={slashPos}
          filter={slashFilter}
        />
        <div className="flex-1 overflow-hidden flex">
          {/* Editor Content */}
          <div className="flex-1 overflow-y-auto py-0">
            <div className={`${readOnly ? 'slate-renderer' : 'slate-editor'} outline-none min-h-[200px]`}>
              <Editable
                className="outline-none min-h-[200px]"
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder={readOnly ? undefined : placeholder}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                spellCheck={false}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      </Slate>
    </div>
  )
}

const withShortcuts = (editor: Editor) => {
  const { deleteBackward, insertText } = editor

  editor.insertText = (text) => {
    const { selection } = editor

    if (text.endsWith(' ') && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const block = Editor.above(editor, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })
      const path = block ? block[1] : []
      const start = Editor.start(editor, path)
      const range = { anchor, focus: start }
      const beforeText = Editor.string(editor, range) + text.slice(0, -1)
      const type = SHORTCUTS[beforeText]

      // Markdown code block shortcut: ``` or ```shell
      const codeBlockMatch = beforeText.match(/^```(\w*)/)
      if (codeBlockMatch) {
        Transforms.select(editor, range)
        Transforms.delete(editor)
        Transforms.setNodes<SlateElement>(
          editor,
          { type: 'code-block', language: codeBlockMatch[1] || undefined } as Partial<SlateElement>,
          {
            match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
          }
        )
        return
      }

      if (type) {
        Transforms.select(editor, range)

        const newProperties: Partial<SlateElement> = {
          type: type as any,
        }

        Transforms.delete(editor)

        Transforms.setNodes<SlateElement>(editor, newProperties, {
          match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
        })

        if (type === 'list-item') {
          const list: any = {
            type: 'bulleted-list',
            children: [],
          }
          Transforms.wrapNodes(editor, list, {
            match: (n) =>
              !Editor.isEditor(n) &&
              SlateElement.isElement(n) &&
              n.type === 'list-item',
          })
        }

        return
      }
    }

    insertText(text)
  }

  editor.deleteBackward = (...args) => {
    const { selection } = editor

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: (n) => SlateElement.isElement(n) && Editor.isBlock(editor, n),
      })

      if (match) {
        const [block, path] = match
        const start = Editor.start(editor, path)

        if (
          !Editor.isEditor(block) &&
          SlateElement.isElement(block) &&
          block.type !== 'paragraph' &&
          Point.equals(selection.anchor, start)
        ) {
          const newProperties: Partial<SlateElement> = {
            type: 'paragraph',
          }
          Transforms.setNodes(editor, newProperties)

          if (block.type === 'list-item') {
            Transforms.unwrapNodes(editor, {
              match: (n) =>
                !Editor.isEditor(n) &&
                SlateElement.isElement(n) &&
                (n.type === 'bulleted-list' || n.type === 'numbered-list'),
              split: true,
            })
          }

          return
        }
      }
    }

    deleteBackward(...args)
  }

  return editor
}
