import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200',
        className
      )}
    />
  )
}

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-100 p-5', className)}>
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({
  count = 5,
  className,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export const SkeletonGrid: React.FC<{ count?: number; className?: string }> = ({
  count = 8,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-xl overflow-hidden">
          <Skeleton className="h-28 w-full rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
