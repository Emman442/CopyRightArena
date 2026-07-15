import React, { useState } from 'react';
import { useApp } from './AppContext';
import { ChevronLeft, Copy, Check, ExternalLink, ShieldAlert, AlertCircle, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { useGetAllDisputes, useGetAllWorks } from '../lib/hooks/useCopyRightArena';
import { useWallet } from '../lib/genlayer/wallet';

export const WorkDetailPage: React.FC = () => {
  const { 
    routeParams, 
    navigateTo, 
    addToast 
  } = useApp();

   const { data: disputes } = useGetAllDisputes()
    const { data: works } = useGetAllWorks()
  const workId = routeParams.workId;
  const work = works?.find(w => w.work_id === workId);
  const {address: connectedWallet} = useWallet()
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [verifyHashInput, setVerifyHashInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<'MATCH' | 'MISMATCH' | null>(null);

  if (!work) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 text-center">
        <h2 className="font-display font-bold text-white text-lg">WORK NOT FOUND</h2>
        <button 
          onClick={() => navigateTo('registry')}
          className="mt-4 px-4 py-2 bg-[#7c3aed] text-white font-bold"
        >
          Back to Registry
        </button>
      </div>
    );
  }

  // Get disputes where this work is original or infringing
  const relatedDisputes = disputes?.filter(d => d.original_work_id === work.work_id || d.infringing_work_id === work.work_id);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    addToast('Copied to Clipboard', `${label} has been successfully copied.`, 'success');
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleVerifyHash = () => {
    if (!verifyHashInput.trim()) return;
    if (verifyHashInput.trim().toLowerCase() === work.content_hash.toLowerCase()) {
      setVerificationResult('MATCH');
      addToast('Authenticity Confirmed', 'The cryptographic SHA256 matches exactly with the registry record.', 'success');
    } else {
      setVerificationResult('MISMATCH');
      addToast('Validation Failed', 'The input hash does not match the registered content hash.', 'error');
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 8)}...${addr.substring(34)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 text-[10px] font-mono tracking-wider font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 rounded-none">ACTIVE</span>;
      case 'DISPUTED':
        return <span className="px-2.5 py-1 text-[10px] font-mono tracking-wider font-bold bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 rounded-none">DISPUTED</span>;
      case 'DELISTED':
        return <span className="px-2.5 py-1 text-[10px] font-mono tracking-wider font-bold bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20 rounded-none">DELISTED</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-mono tracking-wider font-bold bg-[#6b7280]/10 text-[#6b7280] border border-[#6b7280]/20 rounded-none">{status}</span>;
    }
  };

  const getLicenseLabel = (type: string) => {
    switch (type) {
      case 'all_rights_reserved': return 'All Rights Reserved';
      case 'non_commercial': return 'Non-Commercial';
      case 'attribution_required': return 'Attribution Required';
      case 'no_derivatives': return 'No Derivatives';
      case 'creative_commons_by': return 'Creative Commons BY';
      case 'creative_commons_by_nc': return 'Creative Commons BY-NC';
      case 'creative_commons_by_nd': return 'Creative Commons BY-ND';
      case 'creative_commons_by_sa': return 'Creative Commons BY-SA';
      default: return type;
    }
  };

  const isCreator = connectedWallet?.toLowerCase() === work.creator.toLowerCase();

  return (
    <div id="work_detail_page" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 text-left">
      {/* Back button */}
      <button
        id="detail_back_btn"
        onClick={() => navigateTo('registry')}
        className="flex items-center text-[#888888] hover:text-white font-mono text-[10px] tracking-wider uppercase mb-8 transition-colors duration-150"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Registry
      </button>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN (60% width) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 text-[10px] font-display font-bold tracking-wider bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 rounded-none uppercase">
                {work.content_type}
              </span>
              {getStatusBadge(work.status)}
            </div>
            
            <h1 className="font-display font-bold text-3xl md:text-5xl text-white tracking-tight leading-none uppercase">
              {work.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-[#888888] pt-2">
              <div className="flex items-center space-x-2">
                <span>Creator:</span>
                <span className="text-white bg-[#0f0f0f] px-2 py-0.5 border border-[#1e1e1e]">
                  {formatAddress(work.creator)}
                </span>
                <button 
                  onClick={() => handleCopy(work.creator, 'Creator Wallet')}
                  className="text-[#444444] hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <span>Registered:</span> <span className="text-[#888888]">{work.registered_at}</span>
              </div>
            </div>
          </div>

          {/* Content Preview card */}
          <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-6 space-y-6">
            <h4 className="font-display font-bold text-[10px] tracking-widest text-[#a78bfa] uppercase">
              REGISTERED CONTENT
            </h4>

            {/* Media rendering based on type */}
            <div className="w-full bg-black border border-[#1e1e1e] flex items-center justify-center overflow-hidden">
              {work.content_type === 'image' && (
                <img 
                  src={work.content_url} 
                  alt={work.title} 
                  className="max-h-[400px] w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              )}

              {work.content_type === 'audio' && (
                <div className="p-8 w-full text-center space-y-4">
                  <span className="font-display font-bold text-xs tracking-wider text-[#a78bfa] block">AUDIO STREAM REGISTERED</span>
                  <audio controls className="w-full max-w-md mx-auto h-10 accent-[#7c3aed]">
                    <source src={work.content_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                  <a 
                    href={work.content_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center space-x-1 font-mono text-[10px] text-[#888888] hover:text-white"
                  >
                    <span>Direct Audio Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {work.content_type === 'video' && (
                <div className="p-8 w-full text-center space-y-4">
                  <span className="font-display font-bold text-xs tracking-wider text-[#a78bfa] block">VIDEO BROADCAST REGISTERED</span>
                  <video controls className="w-full max-w-md mx-auto aspect-video border border-[#1e1e1e]">
                    <source src={work.content_url} type="video/mp4" />
                    Your browser does not support the video element.
                  </video>
                  <a 
                    href={work.content_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center space-x-1 font-mono text-[10px] text-[#888888] hover:text-white"
                  >
                    <span>Direct Video Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {work.content_type === 'music' && (
                <div className="p-8 w-full text-center space-y-4">
                  <span className="font-display font-bold text-xs tracking-wider text-[#a78bfa] block">MUSIC MASTER COMPOSITION</span>
                  <audio controls className="w-full max-w-md mx-auto h-10 accent-[#7c3aed]">
                    <source src={work.content_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                  <a 
                    href={work.content_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center space-x-1 font-mono text-[10px] text-[#888888] hover:text-white"
                  >
                    <span>Direct Music Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {work.content_type === 'text' && (
                <div className="p-6 w-full text-left bg-[#050505] min-h-[150px] max-h-[300px] overflow-y-auto">
                  <p className="font-mono text-xs text-[#888888] leading-relaxed whitespace-pre-wrap">
                    {work.description}
                  </p>
                </div>
              )}
            </div>

            {/* Description (If not already shown for Text) */}
            {work.content_type !== 'text' && (
              <p className="font-sans text-xs text-[#888888] leading-relaxed">
                {work.description}
              </p>
            )}

            {/* URL Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-[#1e1e1e] pt-4 font-mono text-xs text-[#888888]">
              <span>Content URL:</span>
              <div className="flex items-center space-x-2 max-w-md truncate bg-[#0f0f0f] border border-[#1e1e1e] px-3 py-1 text-white">
                <span className="truncate">{work.content_url}</span>
                <button 
                  onClick={() => handleCopy(work.content_url, 'Content URL')}
                  className="text-[#444444] hover:text-white ml-2 flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content Hash Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-[#888888]">
              <span>Content Hash (SHA256):</span>
              <div className="flex items-center space-x-2 bg-[#0f0f0f] border border-[#1e1e1e] px-3 py-1 text-[#888888] truncate max-w-md">
                <span className="truncate">{work.content_hash}</span>
                <button 
                  onClick={() => handleCopy(work.content_hash, 'SHA256 Hash')}
                  className="text-[#444444] hover:text-white ml-2 flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Transcript URL */}
            {work.transcript_url && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-[#888888]">
                <span>Transcript / Summary URL:</span>
                <a 
                  href={work.transcript_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-[#a78bfa] hover:text-white inline-flex items-center space-x-1"
                >
                  <span>View Transcript File</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* License terms card */}
          <div className="bg-[#0a0a0a] border border-[#1e1e1e] p-6 space-y-6">
            <h4 className="font-display font-bold text-[10px] tracking-widest text-[#a78bfa] uppercase">
              LICENSE TERMS
            </h4>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="font-display font-bold text-sm border border-[#7c3aed] text-white px-4 py-2 bg-black uppercase tracking-wider">
                {getLicenseLabel(work.license_type)}
              </span>
              
              <div className="text-right">
                <div className="font-mono text-[9px] text-[#888888] uppercase">Royalty Redirect Fee</div>
                <div className="font-sans font-bold text-white text-base">
                  {work.royalty_percentage}% of commercial revenue
                </div>
              </div>
            </div>

            <div className="bg-[#050505] p-4 border border-[#1e1e1e] text-left">
              <p className="font-mono text-xs text-[#888888] leading-relaxed">
                {work.license_description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-[#888888]">
              <span>Payment Gateway Address:</span>
              <div className="flex items-center space-x-2 bg-[#0f0f0f] border border-[#1e1e1e] px-3 py-1 text-white">
                <span className="truncate">{work.revenue_address}</span>
                <button 
                  onClick={() => handleCopy(work.revenue_address, 'Payment Address')}
                  className="text-[#444444] hover:text-white ml-2 flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Dispute History section */}
          {relatedDisputes?.length! > 0 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg text-white">
                DISPUTE HISTORY
              </h3>
              <div className="border border-[#1e1e1e] bg-[#0a0a0a]">
                <div className="divide-y divide-[#1e1e1e]">
                  {relatedDisputes?.map((d) => {
                    const isClaimant = d.claimant.toLowerCase() === work.creator.toLowerCase();
                    const roleLabel = isClaimant ? 'Claimant' : 'Respondent';
                    return (
                      <div 
                        key={d.dispute_id}
                        id={`dispute_row_${d.dispute_id}`}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-sans text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-mono text-[#7c3aed] font-bold">
                            #{d.dispute_id.substring(0, 12)}
                          </div>
                          <div className="text-[#888888]">
                            Role: <span className="text-white font-semibold">{roleLabel}</span> • Status: <span className="text-white font-semibold">{d.status}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className="font-mono text-[#888888]">
                            Filed {d.filed_at}
                          </span>
                          <button
                            onClick={() => navigateTo('dispute-detail', { disputeId: d.dispute_id })}
                            className="font-sans font-bold text-xs text-[#a78bfa] hover:text-white uppercase tracking-wider"
                          >
                            View Dispute
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (sticky) (40% width) */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {/* Quick Info card */}
          <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-6 space-y-6">
            <h4 className="font-display font-bold text-[10px] tracking-widest text-[#a78bfa] uppercase">
              WORK DETAILS
            </h4>

            <div className="divide-y divide-[#1e1e1e] font-sans text-xs">
              <div className="py-3 flex justify-between">
                <span className="text-[#888888]">Type:</span>
                <span className="text-white font-bold">{work.content_type}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#888888]">License Model:</span>
                <span className="text-white font-bold">{getLicenseLabel(work.license_type)}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#888888]">Registered At:</span>
                <span className="text-white font-mono">{work.registered_at}</span>
              </div>
              <div className="py-3 flex justify-between">
                <span className="text-[#888888]">Total Disputes:</span>
                <span className="text-white font-bold">{work.dispute_ids.length
                  }</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-[#888888]">On-chain Status:</span>
                {getStatusBadge(work.status)}
              </div>
            </div>

            {/* Context action buttons based on status & identity */}
            <div className="pt-2 space-y-3">
              {isCreator ? (
                <>
                  <button
                    onClick={() => addToast('Feature Coming Soon', 'On-chain metadata updates are scheduled for the next hardfork.', 'info')}
                    className="w-full font-sans text-xs font-bold py-3 bg-transparent border border-[#7c3aed] text-[#a78bfa] hover:bg-[#141414] active:scale-97 transition-all duration-150"
                    style={{ borderRadius: '0px' }}
                  >
                    UPDATE LICENSE
                  </button>
                  <button
                    onClick={() => navigateTo('file-dispute')}
                    className="w-full font-sans text-xs font-bold py-3 bg-[#7c3aed] text-white hover:bg-[#6d28d9] active:scale-97 transition-all duration-150"
                    style={{ borderRadius: '0px' }}
                  >
                    FILE DISPUTE AGAINST ANOTHER
                  </button>
                </>
              ) : (
                <>
                  {work.status === 'active' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => navigateTo('file-dispute')}
                        className="w-full font-sans text-xs font-bold py-3 bg-transparent border border-[#dc2626] text-[#dc2626] hover:bg-red-950/20 active:scale-97 transition-all duration-150"
                        style={{ borderRadius: '0px' }}
                      >
                        REPORT INFRINGEMENT
                      </button>
                      <p className="font-sans text-[10px] text-[#888888] text-center">
                        Filing fee: 10 GEN held in escrow
                      </p>
                    </div>
                  )}

                  {work.status === 'disputed' && (
                    <div className="bg-[#141414] border border-[#f59e0b]/30 p-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-[#f59e0b] mt-0.5 flex-shrink-0" />
                        <p className="font-sans text-[11px] text-[#888888] leading-relaxed">
                          This work is currently under litigation in an open GenLayer dispute. Licenses or registrations may be adjusted pending final verdict.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Authenticity verification card */}
          <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-6 space-y-4">
            <h4 className="font-display font-bold text-[10px] tracking-widest text-[#a78bfa] uppercase">
              VERIFY AUTHENTICITY
            </h4>
            
            <p className="font-sans text-xs text-[#888888]">
              Verify that an asset you possess matches this official registered copyright record. Paste its SHA256 hash here.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Paste SHA256 content hash..."
                value={verifyHashInput}
                onChange={(e) => {
                  setVerifyHashInput(e.target.value);
                  setVerificationResult(null);
                }}
                className="w-full font-mono text-xs p-3 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed] placeholder-[#444444]"
                style={{ borderRadius: '0px' }}
              />
              <button
                onClick={handleVerifyHash}
                disabled={!verifyHashInput.trim()}
                className={`w-full font-sans text-xs font-bold py-2 transition-all duration-150 ${
                  verifyHashInput.trim() 
                    ? 'bg-[#7c3aed] text-white hover:bg-[#6d28d9] active:scale-97' 
                    : 'bg-[#1e1e1e] text-[#444444] cursor-not-allowed'
                }`}
                style={{ borderRadius: '0px' }}
              >
                CHECK HASH
              </button>

              {/* Result Indicator */}
              {verificationResult === 'MATCH' && (
                <div className="flex items-center space-x-2 text-[#22c55e] font-display font-bold text-xs p-3 bg-[#22c55e]/10 border border-[#22c55e]/20">
                  <CheckCircle className="w-4 h-4" />
                  <span>CRYPTOGRAPHIC MATCH ✓</span>
                </div>
              )}

              {verificationResult === 'MISMATCH' && (
                <div className="flex items-center space-x-2 text-[#dc2626] font-display font-bold text-xs p-3 bg-[#dc2626]/10 border border-[#dc2626]/20">
                  <XCircle className="w-4 h-4" />
                  <span>HASH MISMATCH ✗</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
