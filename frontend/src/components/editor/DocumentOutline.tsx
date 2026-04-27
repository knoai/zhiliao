import React, { useEffect, useState, useRef } from 'react'
import type { Descendant } from 'slate'
import { Link2 } from 'lucide-react'

interface Heading {
  id: string
  level: number
  text: string
}

interface DocumentOutlineProps {
  content: Descendant[]
  onHeadingClick?: (id: string) => void
}

// 计算元素相对于滚动容器的偏移
const getRelativeOffsetTop = (element: HTMLElement, container: HTMLElement): number => {
  let offset = 0
  let current: HTMLElement | null = element

  while (current && current !== container) {
    offset += current.offsetTop
    current = current.offsetParent as HTMLElement
    // 如果 offsetParent 是 body 或 null，说明已经超出容器范围
    if (!current || current === document.body) {
      break
    }
  }

  return offset
}

export const DocumentOutline: React.FC<DocumentOutlineProps> = ({
  content,
  onHeadingClick,
}) => {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const visibleRef = useRef<Set<string>>(new Set())

  // 提取标题 - 优先使用 content 中已有的 id
  useEffect(() => {
    const extracted: Heading[] = []
    let headingCount = 0

    const extractFromNode = (node: any) => {
      if (node.type?.startsWith('heading-')) {
        const level = parseInt(node.type.replace('heading-', ''))
        const text = node.children?.map((child: any) => child.text).join('') || ''
        if (text.trim()) {
          // 优先使用节点已有的 id，否则生成新的
          const id = node.id || `heading-${headingCount++}`
          extracted.push({ id, level, text })
        }
      }
      if (node.children) {
        node.children.forEach(extractFromNode)
      }
    }

    content.forEach(extractFromNode)
    setHeadings(extracted)
  }, [content])

  // 使用 IntersectionObserver 高亮当前标题
  useEffect(() => {
    if (headings.length === 0) return

    const scrollContainer = document.getElementById('editor-scroll-container')
    if (!scrollContainer) return

    const updateActive = () => {
      const visible = visibleRef.current
      if (visible.size === 0) {
        // 没有可见标题时，保持上一个 active 或设为第一个
        return
      }
      // 在可见标题中按文档顺序选择最上面的
      for (const h of headings) {
        if (visible.has(h.id)) {
          setActiveId(h.id)
          return
        }
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id
          if (entry.isIntersecting) {
            visibleRef.current.add(id)
          } else {
            visibleRef.current.delete(id)
          }
        })
        updateActive()
      },
      {
        root: scrollContainer,
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    )

    // 观察所有标题元素（延迟确保 DOM 已渲染）
    const observeHeadings = () => {
      headings.forEach((h) => {
        const el = document.getElementById(h.id)
        if (el) observer.observe(el)
      })
      // 初始高亮
      updateActive()
    }

    const timer = setTimeout(observeHeadings, 100)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
      visibleRef.current.clear()
    }
  }, [headings])

  const handleClick = (heading: Heading) => {
    const element = document.getElementById(heading.id)
    const scrollContainer = document.getElementById('editor-scroll-container')
    if (element && scrollContainer) {
      // 计算元素相对于滚动容器的实际偏移，留出顶部偏移
      const elementTop = getRelativeOffsetTop(element, scrollContainer) - 80
      scrollContainer.scrollTo({ top: Math.max(0, elementTop), behavior: 'smooth' })
    }
    onHeadingClick?.(heading.id)
    setActiveId(heading.id)
  }

  if (headings.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3 text-gray-500 text-sm font-medium">
          <Link2 className="w-4 h-4" />
          <span>目录</span>
        </div>
        <div className="text-sm text-gray-400 py-2">
          本文档暂无目录
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-gray-500 text-sm font-medium">
        <Link2 className="w-4 h-4" />
        <span>目录</span>
      </div>
      <nav className="space-y-0.5">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => handleClick(heading)}
            className={`outline-item w-full text-left text-sm py-1.5 px-2 rounded ${
              activeId === heading.id
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
            title={heading.text}
          >
            <span className="block truncate">{heading.text}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

/**
 * 为 Slate 内容中的标题添加 ID
 */
export function addHeadingIds(content: Descendant[]): Descendant[] {
  let headingCount = 0

  const processNode = (node: any): any => {
    if (node.type?.startsWith('heading-')) {
      return {
        ...node,
        id: `heading-${headingCount++}`,
      }
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(processNode),
      }
    }
    return node
  }

  return content.map(processNode)
}
