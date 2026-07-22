import { useState } from 'react'
import { FileUpload } from '../file-upload'
import type { UploadedFile } from '../file-upload'

export interface EvidenceSubmissionProps {
  disputeId: string
  onEvidenceSubmitted?: (evidence: { cid: string; fileName: string; description: string }) => void
}

export function EvidenceSubmission({ disputeId, onEvidenceSubmitted }: EvidenceSubmissionProps) {
  const [description, setDescription] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleUploadComplete = (entry: UploadedFile) => {
    setUploadedFiles(prev => [...prev, entry])
    if (entry.cid) {
      onEvidenceSubmitted?.({ cid: entry.cid, fileName: entry.file.name, description })
      setDescription('')
    }
  }

  const handleUploadError = (entry: UploadedFile) => {
    console.error('Evidence upload failed:', entry.error)
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="evidence-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Evidence Description
        </label>
        <textarea
          id="evidence-desc"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe what this evidence contains and why it's relevant to the dispute..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <FileUpload
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        accept="image/*,application/pdf,text/plain,application/zip,.doc,.docx"
        multiple={false}
      />

      {uploadedFiles.length > 0 && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Evidence submitted successfully:</span>
          </div>
          <ul className="mt-2 space-y-1">
            {uploadedFiles.map(f => (
              <li key={f.id} className="text-xs text-green-600 dark:text-green-400 font-mono">
                {f.file.name} — CID: {f.cid?.slice(0, 12)}…{f.cid?.slice(-8)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
