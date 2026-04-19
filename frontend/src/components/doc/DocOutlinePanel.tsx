import React from 'react'
import type { Descendant } from 'slate'
import { DocumentOutline } from '@/components/editor/DocumentOutline'
import { DocFooter } from './DocFooter'

interface DocOutlinePanelProps {
  content: Descendant[]
  readMode: boolean
  author?: string
  createdAt?: string
  updatedAt?: string
  wordCount?: number
}

export const DocOutlinePanel: React.FC<DocOutlinePanelProps> = ({
  content,
  readMode,
  author,
  createdAt,
  updatedAt,
  wordCount,
}) => {
  return (
    <div className="w-56 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0 hidden lg:block">
      <div className="p-4">
        <DocumentOutline content={content} />

        {/* Document Info Card - only in read mode */}
        {readMode && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-3">文档信息</h4>
            <DocFooter
              author={author || '-'}
              createdAt={createdAt}
              updatedAt={updatedAt}
              wordCount={wordCount}
            />
          </div>
        )}
      </div>
    </div>
  )
}
