import { useState } from 'react'
import type { Evidence as EvidenceType } from '../../../shared/types/dispute'

export interface EvidenceViewerProps {
  evidence: EvidenceType[]
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const MIME_ICONS: Record<string, string> = {
  'application/pdf': '📄',
  'image/': '🖼️',
  'text/': '📝',
  'application/zip': '📦',
  'application/x-zip': '📦',
}

function getIcon(mime: string): string {
  for (const key of Object.keys(MIME_ICONS)) {
    if (mime.startsWith(key)) return MIME_ICONS[key]
  }
  return '📎'
}

export function EvidenceViewer({ evidence }: EvidenceViewerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyCid = async (cid: string, id: string) => {
    try {
      await navigator.clipboard.writeText(cid)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  if (evidence.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-2">📂</div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No evidence has been submitted yet.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {evidence.map(ev => (
        <div key={ev.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
          <span className="text-xl flex-shrink-0 mt-1">{getIcon(ev.mimeType)}</span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
                {ev.fileName}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ev.status] || 'bg-gray-100 text-gray-800'}`}>
                {ev.status}
              </span>
            </div>

            {ev.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{ev.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-500">{formatBytes(ev.fileSize)}</span>

              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                  CID: {ev.cid.slice(0, 8)}…{ev.cid.slice(-6)}
                </span>
                <button
                  type="button"
                  onClick={() => copyCid(ev.cid, ev.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Copy CID"
                >
                  {copiedId === ev.id ? (
                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>

              <span className="text-xs text-gray-400 dark:text-gray-500">
                by {ev.submittedBy.slice(0, 6)}…{ev.submittedBy.slice(-4)}
              </span>

              <span className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(ev.submittedAt).toLocaleDateString()}
              </span>

              <a
                href={`https://ipfs.io/ipfs/${ev.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                View on IPFS ↗
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
