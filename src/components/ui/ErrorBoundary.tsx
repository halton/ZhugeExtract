import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
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
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full mx-4">
            <div className="card text-center">
              <div className="card-body">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-xl mb-6 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  应用遇到了错误
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  很抱歉，应用遇到了意外错误。请尝试刷新页面或联系技术支持。
                </p>
                {this.state.error && (
                  <details className="text-left mb-6">
                    <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 mb-2">
                      错误详情
                    </summary>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-auto text-gray-700 dark:text-gray-300">
                      {this.state.error.toString()}
                    </pre>
                  </details>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  刷新页面
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}