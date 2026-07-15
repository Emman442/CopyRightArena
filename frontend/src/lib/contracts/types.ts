export interface CreatorProfile {
  wallet: string;
  display_name: string;
  bio: string;
  total_works: number;
  total_disputes_filed: number;
  total_disputes_received: number;
  total_disputes_won: number;
  reputation_score: number;
  joined_at: string; // ISO Timestamp or formatted string
}

export type ContentType = "image" | "audio" | "video" | "text" | "music";

export type LicenseType =
  | "all_rights_reserved"
  | "non_commercial"
  | "attribution_required"
  | "no_derivatives"
  | "creative_commons_by"
  | "creative_commons_by_nc"
  | "creative_commons_by_nd"
  | "creative_commons_by_sa";

export type WorkStatus = "active" | "disputed" | "delisted";

export interface Work {
  work_id: string;
  creator: string; // Wallet address
  title: string;
  description: string;
  content_type: ContentType;
  content_url: string;
  transcript_url: string;
  content_hash: string; // SHA256 checksum
  license_type: LicenseType;
  license_description: string;
  royalty_percentage: number; // e.g. 10 for 10%
  revenue_address: string;
  registered_at: string;
  status: WorkStatus;
  dispute_ids: string[];
}

export interface Evidence {
  evidence_id: string;
  dispute_id: string;
  submitted_by: string; // Wallet address
  title: string;
  content_url: string;
  description: string;
  submitted_at: string;
}

export type VerdictStatus = "violation_found" | "no_violation" | "partial_violation" | "inconclusive";
export type ConfidenceLevel = "high" | "medium" | "low";
export type RecommendedAction = "royalty_redirect" | "content_removal" | "attribution_required" | "no_action";

export interface ArbitrationVerdict {
  verdict_id: string;
  dispute_id: string;
  verdict: VerdictStatus;
  similarity_score: number; // 0 to 100
  license_violated: string;
  reasoning: string; // AI Consensus explanation
  confidence: ConfidenceLevel;
  recommended_action: RecommendedAction;
  royalty_redirect_percentage: number;
  is_appeal: boolean;
  rendered_at: string;
  rendered_by: string; // Validator wallet address
}

export type DisputeStatus =
  | "open"
  | "under_review"
  | "verdict_rendered"
  | "appealed"
  | "resolved"
  | "dismissed";

export interface Dispute {
  dispute_id: string;
  claimant: string;
  respondent: string;
  original_work_id: string;
  infringing_work_id: string;
  description: string;
  status: DisputeStatus;
  filing_fee_paid: number;
  verdict_id: string;
  appeal_verdict_id: string;
  filed_at: string;
  resolved_at: string;
  evidence_ids: string[];
  royalty_active: boolean;
}

export interface RoyaltyRedirect {
  redirect_id: string;
  dispute_id: string;
  from_wallet: string;
  to_wallet: string;
  percentage: number;
  active: boolean;
  created_at: string;
  total_redirected: number;
}



export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: any;
}



export interface FullDispute extends Dispute {
  verdict?: ArbitrationVerdict;
  appealVerdict?: ArbitrationVerdict;
  evidence: Evidence[];
}