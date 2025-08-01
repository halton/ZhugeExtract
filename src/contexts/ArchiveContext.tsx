import React, { createContext, useContext, useReducer, useCallback } from 'react'
import type { Archive, ArchiveFile, ExtractionProgress, PreviewData, ErrorInfo } from '@/types'
import { getArchiveService } from '@/services'

interface ArchiveState {
  archives: Archive[]
  currentArchive: Archive | null
  selectedFile: ArchiveFile | null
  extractionProgress: ExtractionProgress | null
  previewData: Map<string, PreviewData>
  errors: ErrorInfo[]
  isLoading: boolean
}

type ArchiveAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_ARCHIVE'; payload: Archive }
  | { type: 'SET_CURRENT_ARCHIVE'; payload: Archive | null }
  | { type: 'SELECT_FILE'; payload: ArchiveFile | null }
  | { type: 'SET_EXTRACTION_PROGRESS'; payload: ExtractionProgress | null }
  | { type: 'SET_PREVIEW_DATA'; payload: { fileId: string; data: PreviewData } }
  | { type: 'ADD_ERROR'; payload: ErrorInfo }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'REMOVE_ARCHIVE'; payload: string }
  | { type: 'CLEAR_ALL' }

const initialState: ArchiveState = {
  archives: [],
  currentArchive: null,
  selectedFile: null,
  extractionProgress: null,
  previewData: new Map(),
  errors: [],
  isLoading: false,
}

function archiveReducer(state: ArchiveState, action: ArchiveAction): ArchiveState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'ADD_ARCHIVE':
      return {
        ...state,
        archives: [...state.archives, action.payload],
        currentArchive: action.payload,
        isLoading: false,
      }

    case 'SET_CURRENT_ARCHIVE':
      return {
        ...state,
        currentArchive: action.payload,
        selectedFile: null, // 切换压缩包时清除选择的文件
      }

    case 'SELECT_FILE':
      return { ...state, selectedFile: action.payload }

    case 'SET_EXTRACTION_PROGRESS':
      return { ...state, extractionProgress: action.payload }

    case 'SET_PREVIEW_DATA':
      const newPreviewData = new Map(state.previewData)
      newPreviewData.set(action.payload.fileId, action.payload.data)
      return { ...state, previewData: newPreviewData }

    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload],
        isLoading: false,
      }

    case 'CLEAR_ERRORS':
      return { ...state, errors: [] }

    case 'REMOVE_ARCHIVE':
      const filteredArchives = state.archives.filter(a => a.id !== action.payload)
      const newCurrentArchive = state.currentArchive?.id === action.payload 
        ? filteredArchives[0] || null 
        : state.currentArchive
      
      return {
        ...state,
        archives: filteredArchives,
        currentArchive: newCurrentArchive,
        selectedFile: state.currentArchive?.id === action.payload ? null : state.selectedFile,
      }

    case 'CLEAR_ALL':
      return { ...initialState }

    default:
      return state
  }
}

interface ArchiveContextType {
  state: ArchiveState
  actions: {
    setLoading: (loading: boolean) => void
    addArchive: (archive: Archive) => void
    setCurrentArchive: (archive: Archive | null) => void
    selectFile: (file: ArchiveFile | null) => void
    setExtractionProgress: (progress: ExtractionProgress | null) => void
    setPreviewData: (fileId: string, data: PreviewData) => void
    addError: (error: ErrorInfo) => void
    clearErrors: () => void
    removeArchive: (archiveId: string) => void
    clearAll: () => void
    // 新增高级操作
    loadArchive: (file: File, password?: string) => Promise<void>
    generatePreview: (file: ArchiveFile, password?: string) => Promise<void>
    downloadFile: (file: ArchiveFile, password?: string) => Promise<void>
  }
}

const ArchiveContext = createContext<ArchiveContextType | undefined>(undefined)

export function ArchiveProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(archiveReducer, initialState)
  const archiveService = getArchiveService()

  // Action creators
  const actions = {
    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading })
    }, []),

    addArchive: useCallback((archive: Archive) => {
      dispatch({ type: 'ADD_ARCHIVE', payload: archive })
    }, []),

    setCurrentArchive: useCallback((archive: Archive | null) => {
      dispatch({ type: 'SET_CURRENT_ARCHIVE', payload: archive })
    }, []),

    selectFile: useCallback((file: ArchiveFile | null) => {
      dispatch({ type: 'SELECT_FILE', payload: file })
    }, []),

    setExtractionProgress: useCallback((progress: ExtractionProgress | null) => {
      dispatch({ type: 'SET_EXTRACTION_PROGRESS', payload: progress })
    }, []),

    setPreviewData: useCallback((fileId: string, data: PreviewData) => {
      dispatch({ type: 'SET_PREVIEW_DATA', payload: { fileId, data } })
    }, []),

    addError: useCallback((error: ErrorInfo) => {
      dispatch({ type: 'ADD_ERROR', payload: error })
      // 自动清理错误：5秒后移除
      setTimeout(() => {
        dispatch({ type: 'CLEAR_ERRORS' })
      }, 5000)
    }, []),

    clearErrors: useCallback(() => {
      dispatch({ type: 'CLEAR_ERRORS' })
    }, []),

    removeArchive: useCallback((archiveId: string) => {
      dispatch({ type: 'REMOVE_ARCHIVE', payload: archiveId })
    }, []),

    clearAll: useCallback(() => {
      dispatch({ type: 'CLEAR_ALL' })
    }, []),

    // 高级操作
    loadArchive: useCallback(async (file: File, password?: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        dispatch({ type: 'CLEAR_ERRORS' })

        const archive = await archiveService.loadArchive(
          file,
          password,
          (progress) => {
            dispatch({ type: 'SET_EXTRACTION_PROGRESS', payload: progress })
          }
        )

        dispatch({ type: 'ADD_ARCHIVE', payload: archive })
        dispatch({ type: 'SET_EXTRACTION_PROGRESS', payload: null })
      } catch (error) {
        const errorInfo: ErrorInfo = {
          id: Date.now().toString(),
          type: 'parsing',
          message: error instanceof Error ? error.message : '未知错误',
          timestamp: new Date()
        }
        dispatch({ type: 'ADD_ERROR', payload: errorInfo })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }, [archiveService]),

    generatePreview: useCallback(async (file: ArchiveFile, password?: string) => {
      try {
        const previewData = await archiveService.generatePreview(file, password)
        dispatch({ type: 'SET_PREVIEW_DATA', payload: { fileId: file.id, data: previewData } })
      } catch (error) {
        const errorInfo: ErrorInfo = {
          id: Date.now().toString(),
          type: 'preview',
          message: `预览失败: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: new Date()
        }
        dispatch({ type: 'ADD_ERROR', payload: errorInfo })
      }
    }, [archiveService]),

    downloadFile: useCallback(async (file: ArchiveFile, password?: string) => {
      try {
        await archiveService.downloadFile(
          file,
          password,
          (progress) => {
            dispatch({ type: 'SET_EXTRACTION_PROGRESS', payload: progress })
          }
        )
        dispatch({ type: 'SET_EXTRACTION_PROGRESS', payload: null })
      } catch (error) {
        const errorInfo: ErrorInfo = {
          id: Date.now().toString(),
          type: 'extraction',
          message: `下载失败: ${error instanceof Error ? error.message : '未知错误'}`,
          timestamp: new Date()
        }
        dispatch({ type: 'ADD_ERROR', payload: errorInfo })
      }
    }, [archiveService]),
  }

  const contextValue: ArchiveContextType = {
    state,
    actions,
  }

  return (
    <ArchiveContext.Provider value={contextValue}>
      {children}
    </ArchiveContext.Provider>
  )
}

export function useArchive() {
  const context = useContext(ArchiveContext)
  if (context === undefined) {
    throw new Error('useArchive must be used within an ArchiveProvider')
  }
  return context
}

// 便捷的Hook导出
export function useArchiveState() {
  const { state } = useArchive()
  return state
}

export function useArchiveActions() {
  const { actions } = useArchive()
  return actions
}