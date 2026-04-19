import { BaseEditor } from 'slate'
import { ReactEditor } from 'slate-react'
import { HistoryEditor } from 'slate-history'

export type CustomElement = {
  type: 
    | 'paragraph'
    | 'heading-one'
    | 'heading-two'
    | 'heading-three'
    | 'heading-four'
    | 'block-quote'
    | 'bulleted-list'
    | 'numbered-list'
    | 'list-item'
    | 'code-block'
    | 'divider'
    | 'link'
    | 'table'
    | 'table-row'
    | 'table-cell'
  children: CustomText[] | CustomElement[]
  url?: string
  language?: string
}

export type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
  strikethrough?: boolean
}

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: CustomElement
    Text: CustomText
  }
}
