import React from 'react'
import { FileText } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 ${className}`}>
      <div className="mb-4">
        {icon || (
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
        )}
      </div>
      <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-xs">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
