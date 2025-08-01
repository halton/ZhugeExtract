import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Theme } from '@/types'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // 从localStorage读取主题设置
    const saved = localStorage.getItem('zhuge-extract-theme')
    return (saved as Theme) || 'system'
  })

  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 保存主题设置到localStorage
    localStorage.setItem('zhuge-extract-theme', theme)

    // 计算实际的暗色模式状态
    const computeDarkMode = () => {
      if (theme === 'dark') {
        return true
      }
      if (theme === 'light') {
        return false
      }
      // system模式：根据系统偏好
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    const updateDarkMode = () => {
      const shouldBeDark = computeDarkMode()
      setIsDark(shouldBeDark)
      
      // 更新DOM类名
      if (shouldBeDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    updateDarkMode()

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        updateDarkMode()
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    isDark,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}