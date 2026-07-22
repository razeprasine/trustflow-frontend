import React, { useCallback, useRef, useState } from 'react'
import styles from './style.module.css'

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface UploadedFile {
  id: string
  file: File
  progress: number
  status: UploadStatus
  /** CID returned by the backend IPFS pinning service, once upload completes. */
  cid?: string
  error?: string
}

export interface FileUploadProps {
  /**
   * Called when a file upload finishes successfully.
   * Receives the file entry with its IPFS CID.
   */
  onUploadComplete?: (entry: UploadedFile) => void
  /**
   * Called when a file upload fails.
   */
  onUploadError?: (entry: UploadedFile) => void
  /**
   * Maximum individual file size in bytes. Defaults to 50 MB.
   */
  maxFileSizeBytes?: number
  /**
   * Comma-separated accept string forwarded to the hidden file input,
   * e.g. "image/*,application/pdf". Defaults to all file types.
   */
  accept?: string
  /**
   * Whether to allow selecting multiple files at once.
   * Defaults to true.
   */
  multiple?: boolean
  /**
   * Whether the whole component is disabled.
   */
  disabled?: boolean
}

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024 // 50 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function uploadToIpfs(
  file: File,
  onProgress: (pct: number) => void,
  signal: AbortSignal
): Promise<{ cid: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const xhr = new XMLHttpRequest()

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Upload aborted', 'AbortError'))
      return
    }

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve({ cid: data.cid })
        } catch {
          reject(new Error('Invalid response from server'))
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.addEventListener('abort', () => reject(new DOMException('Upload aborted', 'AbortError')))

    signal.addEventListener('abort', () => xhr.abort())

    xhr.open('POST', '/api/ipfs/pin')
    xhr.send(formData)
  })
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  maxFileSizeBytes = DEFAULT_MAX_SIZE,
  accept,
  multiple = true,
  disabled = false,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // Keep abort controllers per file id so we can cancel if needed
  const abortRefs = useRef<Map<string, AbortController>>(new Map())

  const addFiles = useCallback(
    (incoming: File[]) => {
      const valid = incoming.filter((f) => {
        if (f.size > maxFileSizeBytes) return false
        return true
      })
      const entries: UploadedFile[] = valid.map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        file: f,
        progress: 0,
        status: 'idle',
      }))
      setFiles((prev) => [...prev, ...entries])
    },
    [maxFileSizeBytes]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(Array.from(e.target.files))
      }
      // Reset input so the same file can be re-selected after removal
      if (inputRef.current) inputRef.current.value = ''
    },
    [addFiles]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      if (disabled) return
      const dropped = Array.from(e.dataTransfer.files)
      addFiles(multiple ? dropped : dropped.slice(0, 1))
    },
    [addFiles, disabled, multiple]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!disabled) setIsDragOver(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const removeFile = useCallback((id: string) => {
    // Abort any in-progress upload
    abortRefs.current.get(id)?.abort()
    abortRefs.current.delete(id)
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const uploadFile = useCallback(
    async (entry: UploadedFile) => {
      const controller = new AbortController()
      abortRefs.current.set(entry.id, controller)

      // Mark as uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === entry.id ? { ...f, status: 'uploading', progress: 0 } : f
        )
      )

      try {
        const { cid } = await uploadToIpfs(
          entry.file,
          (pct) => {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === entry.id ? { ...f, progress: pct } : f
              )
            )
          },
          controller.signal
        )

        const updated: UploadedFile = {
          ...entry,
          progress: 100,
          status: 'success',
          cid,
        }
        setFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? updated : f))
        )
        onUploadComplete?.(updated)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Upload failed'
        const updated: UploadedFile = {
          ...entry,
          progress: 0,
          status: 'error',
          error: message,
        }
        setFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? updated : f))
        )
        onUploadError?.(updated)
      } finally {
        abortRefs.current.delete(entry.id)
      }
    },
    [onUploadComplete, onUploadError]
  )

  const handleUploadAll = useCallback(() => {
    const pending = files.filter(
      (f) => f.status === 'idle' || f.status === 'error'
    )
    pending.forEach(uploadFile)
  }, [files, uploadFile])

  const hasPending = files.some(
    (f) => f.status === 'idle' || f.status === 'error'
  )
  const isUploading = files.some((f) => f.status === 'uploading')

  return (
    <div>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="File upload area. Click or drag and drop files here."
        aria-disabled={disabled}
        className={[
          styles.dropzone,
          isDragOver ? styles.dropzoneActive : '',
          disabled ? styles.dropzoneDisabled : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Upload icon */}
        <svg
          aria-hidden="true"
          className="mb-3 h-10 w-10 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>

        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          {isDragOver ? 'Drop files here' : 'Drag & drop deliverables here'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          or{' '}
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            browse to choose files
          </span>
        </p>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Max file size: {formatBytes(maxFileSizeBytes)}
          {accept ? ` · ${accept}` : ''}
        </p>

        {/* Hidden native file input */}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleInputChange}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className={styles.fileList} aria-label="Selected files">
          {files.map((entry) => (
            <li key={entry.id} className={styles.fileItem}>
              {/* File name row */}
              <div className={styles.fileRow}>
                {/* File type icon */}
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 flex-shrink-0 text-indigo-500 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>

                <span className={styles.fileName} title={entry.file.name}>
                  {entry.file.name}
                </span>

                <span className={styles.fileSize}>
                  {formatBytes(entry.file.size)}
                </span>

                {/* Status badge */}
                {entry.status === 'success' && (
                  <span
                    aria-label="Upload successful"
                    className="text-green-600 dark:text-green-400 text-sm font-bold"
                  >
                    ✓
                  </span>
                )}
                {entry.status === 'error' && (
                  <span
                    aria-label="Upload failed"
                    className="text-red-500 dark:text-red-400 text-sm font-bold"
                  >
                    ✕
                  </span>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeFile(entry.id)}
                  disabled={entry.status === 'uploading'}
                  aria-label={`Remove ${entry.file.name}`}
                >
                  ×
                </button>
              </div>

              {/* Progress bar (visible while uploading or on completion) */}
              {entry.status !== 'idle' && (
                <div
                  className={styles.progressTrack}
                  role="progressbar"
                  aria-valuenow={entry.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Upload progress for ${entry.file.name}`}
                >
                  <div
                    className={[
                      styles.progressFill,
                      entry.status === 'success' ? styles.progressFillSuccess : '',
                      entry.status === 'error' ? styles.progressFillError : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{ width: `${entry.progress}%` }}
                  />
                </div>
              )}

              {/* Status text */}
              {entry.status === 'uploading' && (
                <span className={styles.statusLabel}>
                  Pinning to IPFS… {entry.progress}%
                </span>
              )}
              {entry.status === 'success' && entry.cid && (
                <span
                  className={[styles.statusLabel, styles.statusSuccess].join(' ')}
                  title={entry.cid}
                >
                  Pinned · CID:{' '}
                  <span className="font-mono text-xs">
                    {entry.cid.slice(0, 8)}…{entry.cid.slice(-6)}
                  </span>
                </span>
              )}
              {entry.status === 'error' && (
                <span
                  className={[styles.statusLabel, styles.statusError].join(' ')}
                >
                  {entry.error ?? 'Upload failed'}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Upload all button */}
      {files.length > 0 && (
        <button
          type="button"
          className={styles.uploadBtn}
          onClick={handleUploadAll}
          disabled={disabled || !hasPending || isUploading}
          aria-busy={isUploading}
        >
          {isUploading
            ? 'Uploading…'
            : hasPending
            ? `Pin ${files.filter((f) => f.status === 'idle' || f.status === 'error').length} file${
                files.filter((f) => f.status === 'idle' || f.status === 'error').length !== 1 ? 's' : ''
              } to IPFS`
            : 'All files pinned ✓'}
        </button>
      )}
    </div>
  )
}
