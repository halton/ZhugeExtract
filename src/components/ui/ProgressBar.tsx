import React from 'react'
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react'

interface ProgressBarProps {
  progress: number
  status?: 'idle' | 'processing' | 'completed' | 'error'
  text?: string
  showPercentage?: boolean
  className?: string
}

export function ProgressBar({ 
  progress, 
  status = 'idle', 
  text, 
  showPercentage = true,
  className = '' 
}: ProgressBarProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-primary-500'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600" />
      default:
        return null
    }
  }

  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={`progress-bar ${className}`}>
      {(text || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            {text && (
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {text}
              </span>
            )}
          </div>
          {showPercentage && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${getStatusColor()}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}

interface MultiStepProgressProps {
  steps: Array<{
    label: string
    status: 'pending' | 'processing' | 'completed' | 'error'
  }>
  currentStep: number
  className?: string
}

export function MultiStepProgress({ steps, currentStep, className = '' }: MultiStepProgressProps) {
  return (
    <div className={`multi-step-progress ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center space-y-2">
              {/* 步骤图标 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  step.status === 'completed'
                    ? 'bg-green-500 text-white'
                    : step.status === 'processing'
                    ? 'bg-blue-500 text-white'
                    : step.status === 'error'
                    ? 'bg-red-500 text-white'
                    : index <= currentStep
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              
              {/* 步骤标签 */}
              <span
                className={`text-xs text-center max-w-20 ${
                  step.status === 'completed' || step.status === 'processing' || index <= currentStep
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            
            {/* 连接线 */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 mx-2 mt-[-16px]">
                <div
                  className={`h-full transition-all duration-300 ${
                    index < currentStep || step.status === 'completed'
                      ? 'bg-primary-500'
                      : 'bg-transparent'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}