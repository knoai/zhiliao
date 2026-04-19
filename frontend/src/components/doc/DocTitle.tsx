import React from 'react'

interface DocTitleProps {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
}

export const DocTitle: React.FC<DocTitleProps> = ({ value, onChange, readOnly }) => {
  if (readOnly) {
    return (
      <h1 className="doc-title-static mb-6">
        {value || '无标题文档'}
      </h1>
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder="请输入文档标题..."
      className="doc-title-input mb-6"
    />
  )
}
