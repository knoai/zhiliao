import { Editor, Transforms, Element as SlateElement } from 'slate'
import type { CustomElement, CustomText } from './custom-types'

export const isMarkActive = (editor: Editor, format: keyof CustomText): boolean => {
  const marks = Editor.marks(editor)
  return marks ? (marks as any)[format] === true : false
}

export const toggleMark = (editor: Editor, format: keyof CustomText): void => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

export const isBlockActive = (
  editor: Editor,
  format: CustomElement['type'],
  blockType: 'type' = 'type'
): boolean => {
  const { selection } = editor
  if (!selection) return false

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n) && n[blockType] === format,
    })
  )

  return !!match
}

export const toggleBlock = (editor: Editor, format: CustomElement['type']): void => {
  const isActive = isBlockActive(editor, format)
  const isList = format === 'bulleted-list' || format === 'numbered-list'

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      (n.type === 'bulleted-list' || n.type === 'numbered-list'),
    split: true,
  })

  let newProperties: Partial<SlateElement>
  
  if (isActive) {
    newProperties = {
      type: 'paragraph',
    }
  } else {
    newProperties = {
      type: isList ? 'list-item' : format,
    }
  }

  Transforms.setNodes<SlateElement>(editor, newProperties)

  if (!isActive && isList) {
    const block: CustomElement = {
      type: format,
      children: [],
    }
    Transforms.wrapNodes(editor, block)
  }
}
