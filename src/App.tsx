import { Routes, Route } from 'react-router-dom'
import { ErrorBoundary, ThemeProvider } from './components/ui'
import { ArchiveProvider } from './contexts/ArchiveContext'
import { Header } from './components/layout/Header'
import { MainLayout } from './components/layout/MainLayout'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { HelpPage } from './pages/HelpPage'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ArchiveProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={
                  <MainLayout>
                    <HomePage />
                  </MainLayout>
                } />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="*" element={
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        404
                      </h1>
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                        页面未找到
                      </p>
                      <a
                        href="/"
                        className="btn btn-primary"
                      >
                        返回首页
                      </a>
                    </div>
                  </div>
                } />
              </Routes>
            </main>
          </div>
        </ArchiveProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App