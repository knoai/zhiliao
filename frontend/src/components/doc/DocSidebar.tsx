import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, PanelLeft, FileText } from 'lucide-react'
import type { DocListItem } from '@/types'

interface DocSidebarProps {
  docs: DocListItem[]
  currentDocId?: string
  collapsed: boolean
  onToggle: () => void
  onCreateDoc: () => void
}

export const DocSidebar: React.FC<DocSidebarProps> = ({
  docs,
  currentDocId,
  collapsed,
  onToggle,
  onCreateDoc,
}) => {
  const navigate = useNavigate()

  return (
    <>
      {/* Sidebar */}
      <div
        className={`doc-sidebar flex flex-col border-r border-gray-200 bg-white flex-shrink-0 ${
          collapsed ? 'doc-sidebar-collapsed w-0' : 'w-60'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200 flex-shrink-0">
          <span className="font-medium text-gray-700 text-sm">文档列表</span>
          <div className="flex items-center gap-1">
            <button
              onClick={onCreateDoc}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
              title="新建文档"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
              title="收起侧边栏"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Doc List */}
        <div className="flex-1 overflow-y-auto py-2">
          {docs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => navigate(`/docs/${doc.id}`)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                currentDocId === doc.id
                  ? 'bg-blue-50/60 text-blue-600 border-l-[3px] border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 border-l-[3px] border-transparent'
              }`}
            >
              <FileText
                className={`w-4 h-4 flex-shrink-0 ${
                  currentDocId === doc.id ? 'text-blue-500' : 'text-gray-400'
                }`}
              />
              <span className="truncate">{doc.title || '无标题文档'}</span>
            </button>
          ))}
          {docs.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8">
              暂无文档
            </div>
          )}
        </div>
      </div>

      {/* Floating Expand Button */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="absolute left-3 top-14 z-20 p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          title="展开侧边栏"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}
    </>
  )
}
