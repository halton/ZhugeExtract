// import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600 dark:text-primary-400 mx-auto`} />
        {text && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

interface ProgressSpinnerProps {
  progress: number
  text?: string
  className?: string
}

export function ProgressSpinner({ progress, text, className = '' }: ProgressSpinnerProps) {
  const circumference = 2 * Math.PI * 20
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
            {/* 背景圆环 */}
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* 进度圆环 */}
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-primary-600 dark:text-primary-400 transition-all duration-300 ease-in-out"
            />
          </svg>
          {/* 进度百分比 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        {text && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}