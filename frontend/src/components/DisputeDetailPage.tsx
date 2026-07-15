import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { ChevronLeft, Scale, ExternalLink, ShieldAlert, Sparkles, Terminal, FileText, CheckCircle, ArrowRight, DollarSign, RefreshCw, Send } from 'lucide-react';
import { useAppealVerdict, useFullDispute, useGetAllDisputes, useGetAllWorks, usePayRoyalty, useRenderVerdict, useSubmitEvidence } from '../lib/hooks/useCopyRightArena';
import { useWallet } from '../lib/genlayer/wallet';

export const DisputeDetailPage: React.FC = () => {
  const { data: disputes } = useGetAllDisputes()
  const { data: works } = useGetAllWorks()
  const { isPending: isSubmittingEvidence, mutate: submitEvidence } = useSubmitEvidence()
  const { isPending: isSubmittingAppeal, mutate: submitAppeal } = useAppealVerdict()
  const { isPending: isTriggeringArbitration, mutate: triggerArbitration } = useRenderVerdict()
  const { isPending: isPayingRoyalty, mutate: payRoyalty } = usePayRoyalty()
  const {
    routeParams,
    navigateTo,
    addToast,
  } = useApp();



  const { address: connectedWallet } = useWallet()

  const disputeId = routeParams.disputeId;

  const { data: dispute, isLoading } = useFullDispute(disputeId);
  // States
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [arbitrationLogs, setArbitrationLogs] = useState<string[]>([]);
  const [appealReason, setAppealReason] = useState('');
  const [appealEvidence, setAppealEvidence] = useState('');
  const [appealOpen, setAppealOpen] = useState(false);
  const [saleAmount, setSaleAmount] = useState('100');

  // Find associated works
  const originalWork = works?.find(w => w.work_id === dispute?.original_work_id);
  const infringingWork = works?.find(w => w.work_id === dispute?.infringing_work_id);

  if (!dispute) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 text-center">
        <h2 className="font-display font-bold text-white text-lg">DISPUTE NOT FOUND</h2>
        <button
          onClick={() => navigateTo('disputes')}
          className="mt-4 px-4 py-2 bg-[#7c3aed] text-white font-bold"
        >
          Back to Disputes
        </button>
      </div>
    );
  }

  const handleEvidenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedWallet) {
      addToast('Wallet Connection Needed', 'Connect your wallet first.', 'info');
      return;
    }
    if (!evidenceUrl.trim() || !evidenceTitle.trim()) {
      addToast('Missing Fields', 'Please provide a Title and URL.', 'error');
      return;
    }


    const isClaimant = connectedWallet.toLowerCase() === originalWork?.creator.toLowerCase();
    const submittedBy = isClaimant ? 'claimant' : 'respondent';

    submitEvidence({disputeId :dispute.dispute_id, contentUrl: evidenceUrl, title: evidenceTitle, description: evidenceDesc}, {

      onSuccess: ()=>{
        addToast("Evidence Submitted!", "Evidence submitted successfully!", "success")
      },
      onError: ()=>{
        addToast("Evidence Submission Unsuccessful", "Failed to submit evidence, Please try again", "error")
      }
    });
  };

  // Run a gorgeous live terminal emulator simulation before updating the DB state
  const handleTriggerArbitration = async () => {

    try {
      await triggerArbitration({
        disputeId: dispute.dispute_id,
      });

      addToast(
        "Arbitration Complete",
        "Consensus successfully reached.",
        "success"
      );
    } catch (err: any) {
      addToast(
        "Arbitration Error",
        err.message ?? "Consensus execution failed",
        "error"
      );
    } finally {
    }
  };

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) return;


    submitAppeal({ disputeId: dispute.dispute_id, appealContext: appealReason, newEvidenceUrl: appealEvidence }, {
      onSuccess: () => {
        addToast("Appeal Submitted", "Appeal filed successfully", "success")
      },
      onError: () => {
        addToast("Appeal  Unsuccessful", "Failed to file appeal", "error")
      }
    })
  };

  const handlePayRoyalty = () => {
    const amt = parseFloat(saleAmount);
    if (isNaN(amt) || amt <= 0) return;

    payRoyalty({ redirectId: dispute.dispute_id, amountInGen: Number(saleAmount) }, { onSuccess: () => { addToast("Royalty paid!", "Royalty paid successfully!", "success") }, onError: () => { addToast("Royalty payment unsuccessful", "Failed to pay royalty!", "error") } });
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 rounded-none">OPEN</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 rounded-none">UNDER REVIEW</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 rounded-none">RESOLVED</span>;
      default:
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#6b7280]/10 text-[#6b7280] border border-[#6b7280]/20 rounded-none">{status}</span>;
    }
  };

  const getVerdictBadge = (verdict: any) => {
    if (!verdict) return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#444444]/10 text-[#888888] border border-[#444444]/20 rounded-none">AWAITING VERDICT</span>;

    switch (verdict.verdictType) {
      case 'VIOLATION_FOUND':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20 rounded-none">VIOLATION FOUND</span>;
      case 'PARTIAL_VIOLATION':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 rounded-none">PARTIAL VIOLATION</span>;
      case 'NO_VIOLATION':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 rounded-none">NO VIOLATION</span>;
      default:
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#6b7280]/10 text-[#6b7280] border border-[#6b7280]/20 rounded-none">INCONCLUSIVE</span>;
    }
  };

  const getVerdictBorderColor = (type: string) => {
    switch (type) {
      case 'VIOLATION_FOUND': return 'border-l-4 border-l-[#dc2626]';
      case 'PARTIAL_VIOLATION': return 'border-l-4 border-l-[#f59e0b]';
      case 'NO_VIOLATION': return 'border-l-4 border-l-[#22c55e]';
      default: return 'border-l-4 border-l-[#7c3aed]';
    }
  };

  const getVerdictTextColor = (type: string) => {
    switch (type) {
      case 'VIOLATION_FOUND': return 'text-[#dc2626]';
      case 'PARTIAL_VIOLATION': return 'text-[#f59e0b]';
      case 'NO_VIOLATION': return 'text-[#22c55e]';
      default: return 'text-[#a78bfa]';
    }
  };

  return (
    <div id="dispute_detail_page" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 text-left">
      {/* Back Button */}
      <button
        onClick={() => navigateTo('disputes')}
        className="flex items-center text-[#888888] hover:text-white font-mono text-[10px] tracking-wider uppercase mb-8 transition-colors duration-150"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Disputes
      </button>

      {/* Top Overview Banner */}
      <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2 text-left">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm text-[#7c3aed] font-bold">
              DISPUTE #{dispute.dispute_id.substring(0, 16)}
            </span>
            {getStatusBadge(dispute.status)}
            {getVerdictBadge(dispute.verdict)}
          </div>
          <p className="font-sans text-xs text-[#888888]">
            Filed on <span className="text-white font-mono">{dispute.filed_at}</span> • Claimant Address:{' '}
            <span className="text-white font-mono">{formatAddress(dispute.claimant)}</span>
          </p>
        </div>

        {/* Gauge Score if Resolved */}
        {dispute.verdict && (
          <div className="bg-black border border-[#1e1e1e] px-6 py-4 text-center min-w-[180px]">
            <div className="font-mono text-[9px] text-[#888888] uppercase tracking-wider">AI CONSENSUS SIMILARITY</div>
            <div className="font-display font-bold text-3xl text-white mt-1">
              {dispute.verdict.similarity_score}%
            </div>
            {/* Custom mini horizontal gauge */}
            <div className="w-full bg-[#141414] h-1.5 mt-2 rounded-none overflow-hidden">
              <div
                className={`h-full ${dispute.verdict.similarity_score > 75
                  ? 'bg-[#dc2626]'
                  : dispute.verdict.similarity_score > 40
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#22c55e]'
                  }`}
                style={{ width: `${dispute.verdict.similarity_score}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT SECTION (65% width) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Comparative Analysis Block */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider text-left">
              COMPARATIVE ANALYSIS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ORIGINAL WORK CARD */}
              <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-5 space-y-4">
                <span className="font-mono text-[9px] text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-2.5 py-1 tracking-wider uppercase font-bold">
                  ORIGINAL CONTENT REGISTERED
                </span>

                {originalWork ? (
                  <div className="space-y-3 text-left">
                    <h4
                      onClick={() => navigateTo('registry-detail', { workId: originalWork.work_id })}
                      className="font-display font-bold text-sm text-white hover:text-[#7c3aed] cursor-pointer line-clamp-1 uppercase tracking-wide"
                    >
                      {originalWork.title}
                    </h4>

                    {originalWork.content_type === 'image' && (
                      <img
                        src={originalWork.content_url}
                        alt={originalWork.title}
                        className="w-full h-40 object-cover border border-[#1e1e1e]"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    <div className="divide-y divide-[#1e1e1e] font-sans text-[11px] text-[#888888] pt-2">
                      <div className="py-2 flex justify-between">
                        <span>Creator:</span>
                        <span className="text-white font-mono">{formatAddress(originalWork.creator)}</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span>License Type:</span>
                        <span className="text-white font-bold">{originalWork.license_type}</span>
                      </div>
                      <div className="py-2 truncate">
                        <span>Content SHA256:</span>
                        <span className="text-white font-mono block truncate mt-0.5">{originalWork.content_hash}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="font-sans text-xs text-[#888888]">Original registration was delisted or deleted.</p>
                )}
              </div>

              {/* INFRINGING WORK CARD */}
              <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-5 space-y-4">
                <span className="font-mono text-[9px] text-[#dc2626] bg-[#dc2626]/10 border border-[#dc2626]/20 px-2.5 py-1 tracking-wider uppercase font-bold">
                  ALLEGEDLY INFRINGING WORK
                </span>

                {infringingWork ? (
                  <div className="space-y-3 text-left">
                    <h4
                      onClick={() => navigateTo('registry-detail', { workId: infringingWork.work_id })}
                      className="font-display font-bold text-sm text-white hover:text-[#dc2626] cursor-pointer line-clamp-1 uppercase tracking-wide"
                    >
                      {infringingWork.title}
                    </h4>

                    {infringingWork.content_type === 'image' && (
                      <img
                        src={infringingWork.content_url}
                        alt={infringingWork.title}
                        className="w-full h-40 object-cover border border-[#1e1e1e]"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    <div className="divide-y divide-[#1e1e1e] font-sans text-[11px] text-[#888888] pt-2">
                      <div className="py-2 flex justify-between">
                        <span>Creator:</span>
                        <span className="text-white font-mono">{formatAddress(infringingWork.creator)}</span>
                      </div>
                      <div className="py-2 flex justify-between">
                        <span>License Type:</span>
                        <span className="text-white font-bold">{infringingWork.license_type}</span>
                      </div>
                      <div className="py-2 truncate">
                        <span>Content SHA256:</span>
                        <span className="text-white font-mono block truncate mt-0.5">{infringingWork.content_hash}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="font-sans text-xs text-[#888888]">Target work not found on-chain.</p>
                )}
              </div>
            </div>
          </div>

          {/* Claimant Complaint Text */}
          <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-6 space-y-4 text-left">
            <h4 className="font-display font-bold text-[10px] tracking-widest text-[#a78bfa] uppercase">
              CLAIM COMPLAINT STATEMENT
            </h4>
            <div className="bg-black p-4 border border-[#1e1e1e]">
              <p className="font-sans text-xs text-[#888888] leading-relaxed whitespace-pre-wrap">
                {dispute.description}
              </p>
            </div>
          </div>

          {/* Evidence List */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              SUBMITTED COURT EVIDENCE ({dispute.evidence.length})
            </h3>

            {dispute.evidence.length === 0 ? (
              <p className="font-sans text-xs text-[#444444] italic">No physical evidence attached to ledger yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dispute.evidence.map((ev, i) => (
                  <div key={i} className="bg-[#0a0a0a] border border-[#1e1e1e] p-4 space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-white text-xs truncate uppercase tracking-wider">
                        {ev.title || 'Supporting Exhibit'}
                      </h4>
                      <span className={`px-2 py-0.5 text-[8px] font-mono font-bold tracking-wide ${ev.submitted_by === 'claimant'
                        ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
                        : 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20'
                        }`}>
                        {ev.submitted_by?.toUpperCase() || 'CLAIMANT'}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-[#888888] line-clamp-2 leading-relaxed">
                      {ev.description || 'No detailed explanation provided.'}
                    </p>
                    <a
                      href={ev.content_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 font-mono text-[9px] text-[#a78bfa] hover:text-white pt-1"
                    >
                      <span>Examine URL Resource</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Additional Evidence Form */}
          {(dispute.status === 'open' || dispute.status === 'under_review') && (
            <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-6 space-y-4 text-left">
              <h4 className="font-display font-bold text-[10px] tracking-widest text-[#a78bfa] uppercase">
                LODGE ADDITIONAL COURT EXHIBIT
              </h4>
              <p className="font-sans text-[11px] text-[#888888]">
                Are you a party to this case? Submit fresh supporting materials to the block. Both claimants and respondents can add material.
              </p>

              <form onSubmit={handleEvidenceSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] text-[#888888] uppercase">EXHIBIT LABEL</label>
                    <input
                      type="text"
                      placeholder="e.g. Master composition file metadata"
                      value={evidenceTitle}
                      onChange={(e) => setEvidenceTitle(e.target.value)}
                      className="w-full font-sans text-xs p-3 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                      style={{ borderRadius: '0px' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-mono text-[9px] text-[#888888] uppercase">EXHIBIT URL LINK</label>
                    <input
                      type="text"
                      placeholder="https://drive.google.com/..."
                      value={evidenceUrl}
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      className="w-full font-mono text-xs p-3 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                      style={{ borderRadius: '0px' }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[9px] text-[#888888] uppercase">REASONING / DESCRIPTION FOR JUDGE</label>
                  <input
                    type="text"
                    placeholder="Brief description of what this URL proves."
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                    className="w-full font-sans text-xs p-3 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                    style={{ borderRadius: '0px' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEvidence}
                  className="px-6 py-3 bg-transparent border border-[#7c3aed] text-[#a78bfa] hover:bg-[#7c3aed] hover:text-white transition-all duration-150 font-sans font-bold text-xs uppercase"
                  style={{ borderRadius: '0px' }}
                >
                  {isSubmittingEvidence ? 'TRANSMITTING EVIDENCE...' : 'SUBMIT EVIDENCE TO LEDGER'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT SECTION (35% width) - Verdict System */}
        <div className="space-y-6 lg:sticky lg:top-24 text-left">
          {/* Live Consensus Panel */}
          <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-6 space-y-6">
            <h4 className="font-display font-bold text-[10px] tracking-widest text-[#a78bfa] uppercase">
              GENLAYER CONSENSUS COURT
            </h4>

            {/* AWAITING RESOLUTION STATE */}
            {(dispute.status === 'open' || dispute.status === 'under_review') && (
              <div className="space-y-4">
                <div className="p-4 bg-black border border-[#1e1e1e] text-left space-y-2">
                  <p className="font-sans text-xs text-[#888888] leading-relaxed">
                    This dispute is currently in litigation. Any user can trigger the GenLayer AI consensus validators to fetch and evaluate both works.
                  </p>
                  <p className="font-sans text-[10px] text-[#444444]">
                    Validators pull content, evaluate copyright claims using zero-knowledge prompts, and publish finalized verdicts.
                  </p>
                </div>

                {!isTriggeringArbitration ? (
                  <button
                    onClick={handleTriggerArbitration}
                    className="w-full flex items-center justify-center space-x-2 py-4 bg-[#7c3aed] text-white font-sans font-bold text-xs tracking-wider uppercase hover:bg-[#6d28d9] active:scale-97 transition-all duration-150"
                    style={{ borderRadius: '0px' }}
                  >
                    <Scale className="w-4 h-4" />
                    <span>TRIGGER AI ARBITRATION</span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-[#a78bfa] text-xs font-bold uppercase animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>CONSTITUTING JURY GRIDS...</span>
                    </div>

                    {/* Immersive Terminal Emulator */}
                    <div className="w-full bg-black border border-[#1e1e1e] p-4 font-mono text-[9px] text-[#22c55e] h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                      <div className="text-white border-b border-[#1e1e1e] pb-1 mb-2 font-bold flex items-center justify-between">
                        <span>LEDGER CORE LOGS</span>
                        <span className="h-2 w-2 rounded-full bg-[#22c55e] animate-ping"></span>
                      </div>
                      {arbitrationLogs.map((log, index) => (
                        <div key={index} className="leading-snug">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RESOLVED STATE (FINAL VERDICT EXISTS) */}
            {dispute.status === 'resolved' && dispute.verdict && (
              <div className="space-y-6">
                <div className={`p-4 bg-black border border-[#1e1e1e] ${getVerdictBorderColor(dispute.verdict.verdict)} space-y-3`}>
                  <div className="font-mono text-[9px] text-[#888888] uppercase">Consensus Verdict Type:</div>
                  <div className={`font-display font-bold text-base ${getVerdictTextColor(dispute.verdict.verdict)} uppercase tracking-wider`}>
                    {dispute.verdict.verdict.replace(/_/g, ' ')}
                  </div>

                  <hr className="border-[#1e1e1e]" />

                  <div className="space-y-1">
                    <span className="font-mono text-[9px] text-[#888888] uppercase">Court Rationale Summary:</span>
                    <blockquote className="font-mono text-[10px] text-[#888888] leading-relaxed pt-1 select-all italic bg-[#050505] p-2.5 border border-[#1e1e1e] max-h-48 overflow-y-auto">
                      "{dispute.verdict.reasoning}"
                    </blockquote>
                  </div>

                  {dispute.verdict.verdict !== 'no_violation' && originalWork && (
                    <div className="pt-2 border-t border-[#1e1e1e]">
                      <div className="flex items-center space-x-1.5 text-[#a78bfa] font-mono text-[10px] font-bold uppercase">
                        <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
                        <span>ROYALTY REDIRECT: ACTIVE</span>
                      </div>
                      <p className="font-sans text-[10px] text-[#444444] mt-1">
                        All smart contracts on GenLayer now automatically divert {originalWork.royalty_percentage}% of commercial proceeds from infringing work {infringingWork?.work_id} to {formatAddress(originalWork.creator)}.
                      </p>
                    </div>
                  )}
                </div>

                {/* Simulate Royalty Redirect Payments */}
                {dispute.verdict.verdict !== 'no_violation' && originalWork && (
                  <div className="p-4 bg-[#0a0a0a] border border-[#1e1e1e] space-y-4">
                    <div className="font-mono text-[10px] text-white uppercase tracking-wider font-bold">
                      SIMULATE COMMERCIAL SALE
                    </div>

                    <p className="font-sans text-[10px] text-[#888888]">
                      Simulate a public sale/transaction of the infringing work. The GenLayer smart contract will automatically split and redirect royalties.
                    </p>

                    <div className="space-y-3">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#444444]" />
                        <input
                          type="number"
                          placeholder="Amount in GEN"
                          value={saleAmount}
                          onChange={(e) => setSaleAmount(e.target.value)}
                          className="w-full pl-9 pr-16 py-2.5 bg-black border border-[#1e1e1e] font-mono text-xs text-white"
                          style={{ borderRadius: '0px' }}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 font-mono text-[9px] text-[#888888]">
                          GEN
                        </span>
                      </div>

                      <div className="font-mono text-[9px] text-[#888888] flex justify-between px-1">
                        <span>Original Creator Royalty:</span>
                        <span className="text-[#a78bfa] font-bold">
                          {(parseFloat(saleAmount) || 0) * (originalWork.royalty_percentage / 100)} GEN ({originalWork.royalty_percentage}%)
                        </span>
                      </div>

                      <button
                        onClick={handlePayRoyalty}
                        disabled={isPayingRoyalty}
                        className="w-full font-sans font-bold text-xs py-3 bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-all duration-150 active:scale-97 uppercase"
                        style={{ borderRadius: '0px' }}
                      >
                        {isPayingRoyalty ? 'REDIRECTING ROYALTIES...' : 'TRIGGER LEDGER SPLIT'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Appeal System */}
                <div className="pt-2">
                  {!dispute.appeal_verdict_id ? (
                    <div className="border border-[#1e1e1e] bg-[#050505]">
                      <button
                        onClick={() => setAppealOpen(!appealOpen)}
                        className="w-full font-sans font-bold text-xs text-[#888888] hover:text-white py-3 px-4 border-b border-[#1e1e1e] flex items-center justify-between uppercase tracking-wider"
                      >
                        <span>APPEAL THIS VERDICT</span>
                        <span>{appealOpen ? '[-]' : '[+]'}</span>
                      </button>

                      {appealOpen && (
                        <form onSubmit={handleAppealSubmit} className="p-4 space-y-4">
                          <p className="font-sans text-[11px] text-[#444444]">
                            Do you disagree with the AI Consensus jury? Lodge a high-court appeal. This triggers secondary validation filters. Requires an appeal filing fee.
                          </p>
                          <div className="space-y-1">
                            <label className="block font-mono text-[9px] text-[#888888] uppercase">APPEAL REASONING</label>
                            <textarea
                              placeholder="Describe why the AI validators got this decision wrong. Provide context regarding licensing permissions or exceptions..."
                              value={appealReason}
                              onChange={(e) => setAppealReason(e.target.value)}
                              rows={3}
                              className="w-full font-sans text-xs p-2.5 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                              style={{ borderRadius: '0px' }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block font-mono text-[9px] text-[#888888] uppercase">ADDITIONAL EVIDENCE (OPTIONAL URL)</label>
                            <input
                              type="text"
                              placeholder="https://..."
                              value={appealEvidence}
                              onChange={(e) => setAppealEvidence(e.target.value)}
                              className="w-full font-mono text-xs p-2.5 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                              style={{ borderRadius: '0px' }}
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmittingAppeal|| !appealReason.trim()}
                            className="w-full py-2.5 bg-transparent border border-red-500 text-[#dc2626] font-sans font-bold text-[11px] uppercase tracking-wider hover:bg-red-950/20 active:scale-97"
                            style={{ borderRadius: '0px' }}
                          >
                            {isSubmittingAppeal ? 'SUBMITTING HIGH APPEAL...' : 'SUBMIT APPEAL & LOCK 20 GEN'}
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-[#141414] border border-[#f59e0b]/30 space-y-2">
                      <div className="flex items-center space-x-2 text-[#f59e0b] font-mono text-[10px] font-bold uppercase">
                        <Scale className="w-4 h-4" />
                        <span>PENDING APPEAL COURT</span>
                      </div>
                      <p className="font-sans text-[11px] text-[#888888] leading-relaxed">
                        An appeal has been registered. The case has been routed to the high-tier secondary validator cluster for advanced legal review.
                      </p>
                      <div className="p-2.5 bg-black font-mono text-[10px] text-[#444444] border border-[#1e1e1e] italic">
                        "{dispute.description}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
