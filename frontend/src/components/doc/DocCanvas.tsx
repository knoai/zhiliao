import React from 'react'

interface DocCanvasProps {
  children: React.ReactNode
}

export const DocCanvas: React.FC<DocCanvasProps> = ({ children }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f6f7] editor-scroll-container" id="editor-scroll-container">
      <div className="max-w-[780px] mx-auto my-6">
        <div className="doc-paper px-12 py-10">
          {children}
        </div>
      </div>
    </div>
  )
}
