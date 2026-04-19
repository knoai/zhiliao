import React from 'react'
import type { Descendant } from 'slate'

interface SlateRendererProps {
  content: Descendant[]
}

export const SlateRenderer: React.FC<SlateRendererProps> = ({ content }) => {
  return (
    <div className="slate-renderer prose prose-lg max-w-none">
      {content.map((node, index) => (
        <Element key={index} element={node} />
      ))}
    </div>
  )
}

const Element: React.FC<{ element: any }> = ({ element }) => {
  const children = element.children?.map((child: any, i: number) => (
    <Text key={i} text={child} />
  ))

  switch (element.type) {
    case 'heading-one':
      return <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
    case 'heading-two':
      return <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>
    case 'heading-three':
      return <h3 className="text-lg font-bold mt-4 mb-2">{children}</h3>
    case 'heading-four':
      return <h4 className="font-bold mt-4 mb-2">{children}</h4>
    case 'block-quote':
      return (
        <blockquote className="border-l-4 border-blue-500 pl-4 my-4 text-gray-600 italic">
          {children}
        </blockquote>
      )
    case 'bulleted-list':
      return <ul className="list-disc pl-6 my-3">{children}</ul>
    case 'numbered-list':
      return <ol className="list-decimal pl-6 my-3">{children}</ol>
    case 'list-item':
      return <li className="my-1">{children}</li>
    case 'code-block':
      return (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto">
          <code>{children}</code>
        </pre>
      )
    case 'divider':
      return <hr className="my-6 border-gray-300" />
    case 'table':
      return (
        <table className="w-full border-collapse my-4">
          <tbody>{children}</tbody>
        </table>
      )
    case 'table-row':
      return <tr className="border-b border-gray-200">{children}</tr>
    case 'table-cell':
      return <td className="px-4 py-2 border border-gray-200">{children}</td>
    default:
      return <p className="my-3 leading-relaxed">{children}</p>
  }
}

const Text: React.FC<{ text: any }> = ({ text }) => {
  let content = text.text

  if (text.bold) {
    content = <strong className="font-bold">{content}</strong>
  }
  if (text.italic) {
    content = <em className="italic">{content}</em>
  }
  if (text.underline) {
    content = <u>{content}</u>
  }
  if (text.code) {
    content = (
      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
        {content}
      </code>
    )
  }
  if (text.strikethrough) {
    content = <del>{content}</del>
  }

  return <span>{content}</span>
}
