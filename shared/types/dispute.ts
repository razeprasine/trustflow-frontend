export type DisputeStatus = 'pending' | 'active' | 'voting' | 'resolved' | 'appealed'
export type VoteOption = 'plaintiff' | 'defendant' | 'split'
export type EvidenceStatus = 'submitted' | 'approved' | 'rejected'
export type JurorStatus = 'selected' | 'voted' | 'dismissed'

export interface Evidence {
  id: string
  disputeId: string
  submittedBy: string
  fileName: string
  fileSize: number
  cid: string
  mimeType: string
  description: string
  status: EvidenceStatus
  submittedAt: string
}

export interface Juror {
  walletAddress: string
  displayName: string
  status: JurorStatus
  votedAt?: string
  vote?: VoteOption
}

export interface Vote {
  id: string
  disputeId: string
  jurorAddress: string
  option: VoteOption
  justification?: string
  submittedAt: string
}

export interface Dispute {
  id: string
  title: string
  description: string
  plaintiffAddress: string
  plaintiffName: string
  defendantAddress: string
  defendantName: string
  amount: number
  status: DisputeStatus
  evidence: Evidence[]
  jurors: Juror[]
  votes: Vote[]
  verdict?: VoteOption
  createdAt: string
  deadline: string
  resolvedAt?: string
}
