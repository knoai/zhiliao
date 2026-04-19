import type { Descendant } from 'slate'

/**
 * 简单的 Markdown 解析器，将 Markdown 文本转换为 Slate 节点
 */
export function parseMarkdownToSlate(markdown: string): Descendant[] {
  const lines = markdown.split('\n')
  const nodes: Descendant[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // 空行
    if (!trimmedLine) {
      i++
      continue
    }

    // 代码块
    if (trimmedLine.startsWith('```')) {
      const language = trimmedLine.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // 跳过结束标记
      nodes.push({
        type: 'code-block',
        language,
        children: [{ text: codeLines.join('\n') }],
      })
      continue
    }

    // 分割线
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmedLine)) {
      nodes.push({
        type: 'divider',
        children: [{ text: '' }],
      })
      i++
      continue
    }

    // 标题
    const headingMatch = trimmedLine.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2]
      const type = `heading-${['one', 'two', 'three', 'four'][level - 1]}` as any
      nodes.push({
        type,
        children: parseInlineText(text),
      })
      i++
      continue
    }

    // 无序列表
    if (/^[\*\-\+]\s+/.test(trimmedLine)) {
      const listItems: Descendant[] = []
      while (i < lines.length && /^[\*\-\+]\s+/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^[\*\-\+]\s+/, '')
        listItems.push({
          type: 'list-item',
          children: parseInlineText(text),
        })
        i++
      }
      nodes.push({
        type: 'bulleted-list',
        children: listItems as any,
      })
      continue
    }

    // 有序列表
    if (/^\d+\.\s+/.test(trimmedLine)) {
      const listItems: Descendant[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const text = lines[i].trim().replace(/^\d+\.\s+/, '')
        listItems.push({
          type: 'list-item',
          children: parseInlineText(text),
        })
        i++
      }
      nodes.push({
        type: 'numbered-list',
        children: listItems as any,
      })
      continue
    }

    // 引用块
    if (trimmedLine.startsWith('>')) {
      const lines_: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        lines_.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      nodes.push({
        type: 'block-quote',
        children: parseInlineText(lines_.join(' ')),
      })
      continue
    }

    // 表格
    if (trimmedLine.startsWith('|')) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const rowText = lines[i].trim()
        // 跳过分隔行 |---|---|
        if (/^\|[-:|\s]+\|$/.test(rowText) || /^\|[-:|\s]+\|[-:|\s|]*\|$/.test(rowText)) {
          i++
          continue
        }
        // 解析单元格
        const cells = rowText
          .split('|')
          .slice(1, -1) // 去掉首尾空字符串
          .map((cell) => cell.trim())
        if (cells.length > 0) {
          rows.push(cells)
        }
        i++
      }
      
      if (rows.length > 0) {
        const tableNode: any = {
          type: 'table',
          children: rows.map((row) => ({
            type: 'table-row',
            children: row.map((cell) => ({
              type: 'table-cell',
              children: parseInlineText(cell),
            })),
          })),
        }
        nodes.push(tableNode)
      }
      continue
    }

    // 普通段落
    const text = trimmedLine
    nodes.push({
      type: 'paragraph',
      children: parseInlineText(text),
    })
    i++
  }

  // 如果没有内容，添加一个空段落
  if (nodes.length === 0) {
    nodes.push({
      type: 'paragraph',
      children: [{ text: '' }],
    })
  }

  return nodes
}

/**
 * 解析行内文本（粗体、斜体、行内代码等）
 */
function parseInlineText(text: string): any[] {
  const segments: any[] = []
  let remaining = text

  // 正则表达式匹配各种格式
  const patterns = [
    { regex: /\*\*\*(.+?)\*\*\*/g, type: 'bold+italic' }, // ***bold+italic***
    { regex: /\*\*(.+?)\*\*/g, type: 'bold' },           // **bold**
    { regex: /\*(.+?)\*/g, type: 'italic' },             // *italic*
    { regex: /`(.+?)`/g, type: 'code' },                // `code`
    { regex: /__(.+?)__/g, type: 'bold' },              // __bold__
    { regex: /_(.+?)_/g, type: 'italic' },              // _italic_
    { regex: /~~(.+?)~~/g, type: 'strikethrough' },     // ~~strikethrough~~
  ]

  // 找出所有匹配位置
  const matches: { start: number; end: number; text: string; type: string }[] = []
  
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex.source, 'g')
    let match
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        type: pattern.type,
      })
    }
  }

  // 按位置排序
  matches.sort((a, b) => a.start - b.start)

  // 移除重叠的匹配
  const filteredMatches: typeof matches = []
  let lastEnd = -1
  for (const match of matches) {
    if (match.start >= lastEnd) {
      filteredMatches.push(match)
      lastEnd = match.end
    }
  }

  // 构建结果
  let currentPos = 0
  for (const match of filteredMatches) {
    // 添加匹配前的普通文本
    if (match.start > currentPos) {
      segments.push({ text: text.slice(currentPos, match.start) })
    }

    // 添加格式化的文本
    const marks: Record<string, boolean> = {}
    if (match.type.includes('bold')) marks.bold = true
    if (match.type.includes('italic')) marks.italic = true
    if (match.type === 'code') marks.code = true
    if (match.type === 'strikethrough') marks.strikethrough = true

    segments.push({ text: match.text, ...marks })
    currentPos = match.end
  }

  // 添加剩余文本
  if (currentPos < text.length) {
    segments.push({ text: text.slice(currentPos) })
  }

  // 如果没有匹配到任何格式，返回原文本
  if (segments.length === 0) {
    return [{ text }]
  }

  return segments
}

/**
 * 检测文本是否为 Markdown 格式
 */
export function isMarkdown(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s+/m,                    // 标题
    /^[\*\-\+]\s+/m,                  // 无序列表
    /^\d+\.\s+/m,                    // 有序列表
    /^>.*/m,                         // 引用
    /^```/m,                         // 代码块
    /\*\*.*?\*\*/,                   // 粗体
    /\*.*?\*/,                       // 斜体
    /`.*?`/,                         // 行内代码
    /^(-{3,}|\*{3,}|_{3,})$/m,      // 分割线
    /\[.*?\]\(.*?\)/,                // 链接
    /!\[.*?\]\(.*?\)/,               // 图片
    /^\|.+\|/m,                      // 表格
  ]

  return markdownPatterns.some((pattern) => pattern.test(text))
}
