import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // 可以在这里发送错误报告到监控服务
    this.reportError(error, errorInfo)
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // 错误上报逻辑
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    // 可以发送到错误监控服务，如Sentry
    console.log('Error Report:', errorReport)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // 如果有自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-strong p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-error-600 dark:text-error-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              哎呀，出现了错误
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              应用遇到了意外错误。我们已经记录了这个问题，会尽快修复。
            </p>

            {/* 开发环境显示详细错误信息 */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  错误详情 (开发模式)
                </summary>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-xs font-mono overflow-auto max-h-40">
                  <div className="text-error-600 dark:text-error-400 mb-2">
                    <strong>错误信息:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div className="text-gray-600 dark:text-gray-400">
                      <strong>调用栈:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full btn btn-primary flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full btn btn-secondary flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                返回首页
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                如果问题持续存在，请{' '}
                <a
                  href="https://github.com/zhuge-extract/zhuge-extract/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                >
                  反馈给我们
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook版本的错误边界
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    
    // 可以触发全局错误状态或显示错误提示
    // 这里可以集成with React Query的错误处理或全局状态管理
  }
}