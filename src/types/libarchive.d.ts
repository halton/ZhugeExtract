declare module 'libarchive.js/main.js' {
  export interface LibArchiveReader {
    getFilesArray(): any[]
    extractSingleFile(path: string, password?: string): Promise<ArrayBuffer>
    extractFiles(password?: string): Promise<Map<string, ArrayBuffer>>
    hasPassword(): boolean
    close(): void
  }

  export interface LibArchiveStatic {
    init(options?: { locateFile?: (path: string) => string }): Promise<LibArchiveStatic>
    open(data: ArrayBuffer, password?: string): Promise<LibArchiveReader>
  }

  export const Archive: LibArchiveStatic
}