import React from 'react'

interface DocCanvasProps {
  children: React.ReactNode
}

export const DocCanvas: React.FC<DocCanvasProps> = ({ children }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f6f7] editor-scroll-container" id="editor-scroll-container">
      <div className="max-w-none lg:max-w-[780px] mx-auto lg:my-6">
        <div className="doc-paper px-4 py-6 lg:px-12 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  )
}
