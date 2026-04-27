import type { Descendant } from 'slate'
import { parseMarkdownToSlate } from '@/components/editor/markdownParser'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_FILES = 200 // 单次导入最大文件数

export interface ImportResult {
  title: string
  content: Descendant[]
}

export interface ImportFolderNode {
  name: string
  path: string
  type: 'folder' | 'file'
  children: ImportFolderNode[]
  file?: File
  content?: Descendant[]
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

/** 触发文件夹选择（支持 webkitdirectory） */
export function triggerFolderSelect(
  onSelect: (files: File[]) => void
): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.setAttribute('webkitdirectory', 'true')
  input.setAttribute('directory', 'true')
  input.onchange = (e) => {
    const files = Array.from((e.target as HTMLInputElement).files || [])
    if (files.length > 0) {
      onSelect(files)
    }
  }
  input.click()
}

/** 从文件列表构建树形结构 */
export function buildFolderTree(files: File[]): ImportFolderNode {
  const root: ImportFolderNode = { name: '', path: '', type: 'folder', children: [] }

  for (const file of files) {
    const path = (file as any).webkitRelativePath || file.name
    const parts = path.split('/')

    // 只处理 .md / .txt / .markdown 文件
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'md' && ext !== 'txt' && ext !== 'markdown') continue

    let current = root
    // 遍历路径中的文件夹层级
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      let child = current.children.find((c) => c.name === part && c.type === 'folder')
      if (!child) {
        child = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: 'folder',
          children: [],
        }
        current.children.push(child)
      }
      current = child
    }

    // 添加文件节点
    current.children.push({
      name: file.name.replace(/\.[^/.]+$/, ''),
      path,
      type: 'file',
      children: [],
      file,
    })
  }

  return root
}

/** 解析整个文件夹的内容 */
export async function importFolder(files: File[]): Promise<ImportFolderNode> {
  if (files.length > MAX_FILES) {
    throw new Error(`文件数量过多，单次导入限制 ${MAX_FILES} 个文件（当前 ${files.length} 个）`)
  }

  const tree = buildFolderTree(files)

  async function parseNode(node: ImportFolderNode): Promise<void> {
    if (node.type === 'file' && node.file) {
      try {
        const result = await importFile(node.file)
        node.content = result.content
      } catch (err: any) {
        console.warn(`解析文件失败: ${node.path}`, err)
        node.content = parsePlainTextToSlate(`[导入失败: ${err?.message || '未知错误'}]`)
      }
      return
    }
    // 同一层级并行解析，提升速度
    await Promise.all(node.children.map((child) => parseNode(child)))
  }

  await parseNode(tree)
  return tree
}

/** 统计树中的文件数量 */
export function countFiles(node: ImportFolderNode): number {
  if (node.type === 'file') return 1
  return node.children.reduce((sum, c) => sum + countFiles(c), 0)
}
