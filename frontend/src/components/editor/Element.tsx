import React from 'react'
import type { CustomElement } from './custom-types'

interface ElementProps {
  attributes: any
  children: React.ReactNode
  element: CustomElement
}

export const Element: React.FC<ElementProps> = ({ attributes, children, element }) => {
  const style: React.CSSProperties = { textAlign: 'left' }

  switch (element.type) {
    case 'block-quote':
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      )
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      )
    case 'heading-one':
      return (
        <h1 id={(element as any).id} style={style} {...attributes} className="scroll-mt-24">
          {children}
        </h1>
      )
    case 'heading-two':
      return (
        <h2 id={(element as any).id} style={style} {...attributes} className="scroll-mt-24">
          {children}
        </h2>
      )
    case 'heading-three':
      return (
        <h3 id={(element as any).id} style={style} {...attributes} className="scroll-mt-24">
          {children}
        </h3>
      )
    case 'heading-four':
      return (
        <h4 id={(element as any).id} style={style} {...attributes} className="scroll-mt-24">
          {children}
        </h4>
      )
    case 'list-item':
      return (
        <li style={style} {...attributes}>
          {children}
        </li>
      )
    case 'numbered-list':
      return (
        <ol style={style} {...attributes}>
          {children}
        </ol>
      )
    case 'code-block':
      return (
        <div {...attributes} style={style} className="my-4">
          {(element as any).language && (
            <div className="px-3 py-1.5 bg-gray-700 text-xs text-gray-300 rounded-t-md border-b border-gray-600">
              {(element as any).language}
            </div>
          )}
          <pre className={`${(element as any).language ? 'rounded-t-none rounded-b-md' : 'rounded-md'} bg-[#1f2937] p-4 m-0 overflow-x-auto text-sm leading-relaxed text-gray-100`}>
            <code>{children}</code>
          </pre>
        </div>
      )
    case 'divider':
      return <hr {...attributes} />
    case 'table':
      return (
        <table className="w-full border-collapse my-4" {...attributes}>
          <tbody>{children}</tbody>
        </table>
      )
    case 'table-row':
      return (
        <tr className="border-b border-gray-200" {...attributes}>
          {children}
        </tr>
      )
    case 'table-cell':
      return (
        <td className="px-4 py-2 border border-gray-200" {...attributes}>
          {children}
        </td>
      )
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      )
  }
}
