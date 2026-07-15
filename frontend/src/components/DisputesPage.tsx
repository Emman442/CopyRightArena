import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { Scale, MessageSquare, AlertCircle } from 'lucide-react';
import { useGetAllDisputes } from '../lib/hooks/useCopyRightArena';

export const DisputesPage: React.FC = () => {
  const { navigateTo, works } = useApp();

  const {data: disputes} = useGetAllDisputes()
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'under_review' | 'resolved'>('all');
  const [filteredDisputes, setFilteredDisputes] = useState(disputes);

  const filters: Array<'all' | 'open' | 'under_review' | 'resolved'> = ['all', 'open', 'under_review', 'resolved'];

  const getFilterLabel = (f: string) => {
    switch (f) {
      case 'all': return 'ALL DISPUTES';
      case 'open': return 'OPEN CLAIMS';
      case 'under_review': return 'UNDER LITIGATION';
      case 'resolved': return 'FINAL VERDICTS';
      default: return f;
    }
  };

  useEffect(() => {
    let result = [...disputes];
    if (activeFilter !== 'all') {
      result = result.filter(d => d.status === activeFilter);
    }
    setFilteredDisputes(result);
  }, [disputes, activeFilter]);

  const getWorkTitle = (workId: string) => {
    return works.find(w => w.work_id === workId)?.title || 'Deleted or Unknown Work';
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
    if (!verdict) return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#444444]/10 text-[#888888] border border-[#444444]/20 rounded-none">PENDING AI</span>;
    
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

  return (
    <div id="disputes_page" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 text-left">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight">
          DISPUTE REGISTRY
        </h1>
        <p className="font-sans text-xs text-[#888888] mt-1">
          Active copyright litigation and resolved on-chain verdicts.
        </p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-2 mb-8">
        {filters.map((f) => (
          <button
            key={f}
            id={`filter_btn_${f}`}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 font-display font-bold text-[10px] tracking-wider uppercase transition-all duration-150 ${
              activeFilter === f
                ? 'bg-[#7c3aed] text-white border border-[#7c3aed]'
                : 'bg-[#0f0f0f] text-[#888888] border border-[#1e1e1e] hover:border-[#2d2d2d]'
            }`}
            style={{ borderRadius: '0px' }}
          >
            {getFilterLabel(f)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredDisputes.length === 0 ? (
        <div id="disputes_empty_state" className="py-24 text-center border border-[#1e1e1e] bg-[#0f0f0f]">
          <span className="font-display font-bold text-xs text-[#444444] uppercase tracking-widest block">
            NO DISPUTES RECORDED
          </span>
          <span className="font-sans text-[10px] text-[#444444] uppercase tracking-wider block mt-2">
            Try choosing a different status filter
          </span>
        </div>
      ) : (
        <div 
          id="disputes_list"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filteredDisputes.map((d) => (
            <div
              key={d.dispute_id}
              id={`dispute_card_${d.dispute_id}`}
              onClick={() => navigateTo('dispute-detail', { disputeId: d.dispute_id })}
              className="group bg-[#0f0f0f] border border-[#1e1e1e] p-6 hover:border-[#2d2d2d] transition-all duration-150 cursor-pointer flex flex-col justify-between"
              style={{ borderRadius: '0px' }}
            >
              <div>
                {/* Upper Badge Row */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-[#7c3aed] font-bold">
                    #{d.dispute_id.substring(0, 12)}
                  </span>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(d.status)}
                    {getVerdictBadge(d.verdict)}
                  </div>
                </div>

                {/* Main Titles Comparison */}
                <div className="space-y-3 mb-4 text-left">
                  <div>
                    <span className="font-mono text-[9px] text-[#444444] uppercase tracking-wider block">Claimant Original:</span>
                    <h3 className="font-display font-bold text-sm text-white group-hover:text-[#a78bfa] transition-colors duration-150 truncate">
                      {getWorkTitle(d.original_work_id)}
                    </h3>
                  </div>

                  <div className="border-l border-[#1e1e1e] pl-3 py-1 bg-black/30">
                    <span className="font-mono text-[9px] text-[#dc2626] uppercase tracking-wider block">Alleged Infringement:</span>
                    <h3 className="font-display font-bold text-sm text-white truncate">
                      {getWorkTitle(d.infringing_work_id)}
                    </h3>
                  </div>
                </div>

                {/* Filed Details */}
                <div className="grid grid-cols-2 gap-4 border-t border-[#1e1e1e] pt-4 mb-4 font-mono text-[10px] text-[#888888]">
                  <div>
                    <span className="text-[#444444] uppercase tracking-wider block">LODGED BY:</span>
                    <span className="text-white">{formatAddress(d.claimant)}</span>
                  </div>
                  <div>
                    <span className="text-[#444444] uppercase tracking-wider block">FILED DATE:</span>
                    <span className="text-white">{d.filed_at}</span>
                  </div>
                </div>
              </div>

              {/* Action Bottom Row */}
              <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-4">
                <div>
                  {d.verdict ? (
                    <div className="font-sans text-[11px] font-bold text-[#a78bfa] flex items-center">
                      <Scale className="w-3.5 h-3.5 mr-1" />
                      <span>Similarity: {d.verdict.similarity_score}%</span>
                    </div>
                  ) : (
                    <div className="font-mono text-[9px] text-[#f59e0b] tracking-wider flex items-center">
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      <span>Await Consensus</span>
                    </div>
                  )}
                </div>
                
                <span className="font-sans text-[10px] font-bold text-[#7c3aed] group-hover:text-white transition-colors duration-150 uppercase tracking-widest">
                  VIEW COURTROOM →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
