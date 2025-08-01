import { getWorkerManager } from './wasm'
import { Archive, ArchiveFile, ExtractionProgress, SupportedFormat, PreviewData } from '@/types'

export class ArchiveService {
  private workerManager = getWorkerManager()
  private currentArchive: Archive | null = null
  private archiveBuffer: ArrayBuffer | null = null

  async loadArchive(
    file: File,
    password?: string,
    onProgress?: (progress: ExtractionProgress) => void
  ): Promise<Archive> {
    try {
      const fileBuffer = await this.fileToArrayBuffer(file)
      this.archiveBuffer = fileBuffer

      const format = await this.workerManager.detectFormat(fileBuffer)
      
      if (format === 'unknown') {
        throw new Error('Unsupported file format')
      }

      const archive = await this.workerManager.parseArchive(
        fileBuffer,
        file.name,
        password,
        onProgress
      )

      this.currentArchive = archive
      return archive
    } catch (error) {
      console.error('Failed to load archive:', error)
      throw new Error(`Failed to load archive: ${error}`)
    }
  }

  getCurrentArchive(): Archive | null {
    return this.currentArchive
  }

  async detectFormat(file: File): Promise<SupportedFormat> {
    const fileBuffer = await this.fileToArrayBuffer(file)
    return this.workerManager.detectFormat(fileBuffer)
  }

  async extractFile(
    filePath: string,
    password?: string,
    onProgress?: (progress: ExtractionProgress) => void
  ): Promise<ArrayBuffer> {
    if (!this.archiveBuffer) {
      throw new Error('No archive loaded')
    }

    return this.workerManager.extractSingleFile(
      this.archiveBuffer,
      filePath,
      password,
      onProgress
    )
  }

  async generatePreview(
    file: ArchiveFile,
    password?: string
  ): Promise<PreviewData> {
    try {
      const fileData = await this.extractFile(file.path, password)
      const previewType = this.detectPreviewType(file.name)
      let content: string | ArrayBuffer | Blob = fileData

      switch (previewType) {
        case 'text':
          content = this.arrayBufferToText(fileData)
          break
        case 'image':
          content = this.arrayBufferToDataURL(fileData, this.getMimeType(file.name))
          break
        case 'pdf':
          content = new Blob([fileData], { type: 'application/pdf' })
          break
        default:
          break
      }

      return {
        fileId: file.id,
        type: previewType,
        content,
        metadata: {
          mimeType: this.getMimeType(file.name),
          fileSize: fileData.byteLength
        }
      }
    } catch (error) {
      console.error('Failed to generate preview:', error)
      throw new Error(`Preview generation failed: ${error}`)
    }
  }

  async downloadFile(
    file: ArchiveFile,
    password?: string,
    onProgress?: (progress: ExtractionProgress) => void
  ): Promise<void> {
    try {
      const fileData = await this.extractFile(file.path, password, onProgress)
      
      const blob = new Blob([fileData])
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download file:', error)
      throw new Error(`Download failed: ${error}`)
    }
  }

  searchFiles(query: string): ArchiveFile[] {
    if (!this.currentArchive) {
      return []
    }

    const searchTerm = query.toLowerCase()
    return this.currentArchive.structure.filter(file => 
      file.name.toLowerCase().includes(searchTerm) ||
      file.path.toLowerCase().includes(searchTerm)
    )
  }

  cleanup(): void {
    this.currentArchive = null
    this.archiveBuffer = null
  }

  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  private detectPreviewType(fileName: string): PreviewData['type'] {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    
    if (['txt', 'md', 'json', 'xml', 'csv', 'log', 'js', 'ts', 'html', 'css'].includes(extension)) {
      return 'text'
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      return 'image'
    }
    
    if (extension === 'pdf') {
      return 'pdf'
    }
    
    if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
      return 'audio'
    }
    
    if (['mp4', 'webm', 'ogg', 'avi'].includes(extension)) {
      return 'video'
    }
    
    return 'binary'
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'json': 'application/json',
      'xml': 'application/xml',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4'
    }
    
    return mimeTypes[extension] || 'application/octet-stream'
  }

  private arrayBufferToText(buffer: ArrayBuffer): string {
    try {
      const decoder = new TextDecoder('utf-8')
      return decoder.decode(buffer)
    } catch {
      try {
        const decoder = new TextDecoder('gbk')
        return decoder.decode(buffer)
      } catch {
        const decoder = new TextDecoder('latin1')
        return decoder.decode(buffer)
      }
    }
  }

  private arrayBufferToDataURL(buffer: ArrayBuffer, mimeType: string): string {
    const uint8Array = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i])
    }
    const base64 = btoa(binary)
    return `data:${mimeType};base64,${base64}`
  }
}

let archiveServiceInstance: ArchiveService | null = null

export function getArchiveService(): ArchiveService {
  if (!archiveServiceInstance) {
    archiveServiceInstance = new ArchiveService()
  }
  return archiveServiceInstance
}

export function destroyArchiveService(): void {
  if (archiveServiceInstance) {
    archiveServiceInstance.cleanup()
    archiveServiceInstance = null
  }
}