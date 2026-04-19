import type { Descendant } from 'slate'
import { parseMarkdownToSlate } from '@/components/editor/markdownParser'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export interface ImportResult {
  title: string
  content: Descendant[]
}

export function parsePlainTextToSlate(text: string): Descendant[] {
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  if (paragraphs.length === 0) {
    return [{ type: 'paragraph', children: [{ text: '' }] }]
  }
  return paragraphs.map((p) => ({
    type: 'paragraph',
    children: [{ text: p.replace(/\n+/g, ' ') }],
  }))
}

export async function importFile(file: File): Promise<ImportResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('文件过大，请拆分成多个小文件后导入（限制 2MB）')
  }

  const text = await file.text()
  if (!text.trim()) {
    throw new Error('文件内容为空')
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  const title = file.name.replace(/\.[^/.]+$/, '') || '导入的文档'

  let content: Descendant[]
  if (ext === 'md' || ext === 'markdown') {
    content = parseMarkdownToSlate(text)
  } else if (ext === 'txt') {
    content = parsePlainTextToSlate(text)
  } else {
    // 未知格式尝试按 markdown 解析，否则按纯文本
    content = parsePlainTextToSlate(text)
  }

  return { title, content }
}

export function triggerFileSelect(
  accept = '.md,.txt,.markdown',
  onSelect: (file: File) => void
): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      onSelect(file)
    }
  }
  input.click()
}
