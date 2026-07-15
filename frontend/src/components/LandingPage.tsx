import React from 'react';
import { useApp } from './AppContext';
import { Gavel, ChevronRight } from 'lucide-react';
import { useGetAllDisputes, useGetAllWorks, useGetVerdict } from '../lib/hooks/useCopyRightArena';

export const LandingPage: React.FC = () => {
  const { navigateTo, } = useApp();
   const { data: disputes } = useGetAllDisputes()
    const { data: works } = useGetAllWorks()

  // Get recent 4 resolved or open disputes to show in the recent arbitrations section
  const recentDisputes = disputes?.sort((a, b) => b.filed_at.localeCompare(a.filed_at))
    .slice(0, 4);

  const getWorkTitle = (workId: string) => {
    return works?.find(w => w.work_id === workId)?.title || 'Unknown Work';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 rounded-none">OPEN</span>;
      case 'under_review':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 rounded-none">UNDER REVIEW</span>;
      case 'resolved':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 rounded-none">RESOLVED</span>;
      default:
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#6b7280]/10 text-[#6b7280] border border-[#6b7280]/20 rounded-none">{status}</span>;
    }
  };


  return (
    <div id="landing_page" className="w-full bg-[#000000] min-h-screen text-white flex flex-col">
      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 text-left md:flex md:items-center">
        <div className="w-full md:w-2/3 space-y-6">
          <div className="font-mono text-[10px] text-[#7c3aed] tracking-[0.2em] mb-4 uppercase font-semibold">
            DECENTRALIZED IP ARBITRATION — POWERED BY GENLAYER
          </div>
          <h1 className="font-display font-bold text-4xl md:text-6xl text-white tracking-tight leading-[1.05] uppercase">
            Register Your Work.<br />
            Set Your Terms.<br />
            AI Enforces Them.
          </h1>
          <p className="font-sans text-[#888888] text-base md:text-lg max-w-xl leading-relaxed">
            An on-chain intellectual property registry and dispute resolution system. 
            Register creative works, define license terms, file infringement claims, 
            and receive AI arbitration verdicts stored permanently on-chain.
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <button
              id="hero_register_btn"
              onClick={() => navigateTo('register-work')}
              className="px-8 py-4 bg-[#7c3aed] text-white font-bold tracking-widest text-xs hover:bg-[#6d28d9] transition-all duration-150 active:scale-95"
              style={{ borderRadius: '0px' }}
            >
              REGISTER A WORK
            </button>
            <button
              id="hero_browse_btn"
              onClick={() => navigateTo('registry')}
              className="px-8 py-4 bg-transparent border border-white text-white font-bold tracking-widest text-xs hover:bg-[#0f0f0f] transition-all duration-150 active:scale-95"
              style={{ borderRadius: '0px' }}
            >
              BROWSE REGISTRY
            </button>
          </div>
          <p className="font-sans text-[11px] text-[#444444] uppercase tracking-wider">
            Registration is free. A filing fee applies to dispute submissions.
          </p>
        </div>
        <div className="hidden md:flex w-1/3 justify-end">
          <div className="p-8 border border-[#1e1e1e] bg-[#0a0a0a] text-center max-w-xs space-y-4 rounded-none">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#7c3aed] mx-auto">
              <path d="M15 5.5V9M15 5.5L19 3M15 5.5L11 3M9 11L5 15M5 15L3 17M5 15L7 13M13 13L17 17L21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
            </svg>
            <div className="font-display font-bold text-xs tracking-widest uppercase text-white">GENLAYER CONSENSUS</div>
            <p className="font-sans text-[11px] text-[#888888] leading-relaxed">
              Decentralized legal tech running on democratic AI validator grids. Verdicts are cryptographically permanent and legally binding in the digital domain.
            </p>
          </div>
        </div>
      </section>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
        <hr className="border-[#1e1e1e]" />
      </div>

      {/* How It Works */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16 text-left">
        <h2 className="font-display font-bold text-xs tracking-widest text-[#888888] uppercase mb-12">
          THE ARBITRATION PROTOCOL
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1 */}
          <div className="space-y-4">
            <div className="font-display font-bold text-4xl text-[#7c3aed]">01</div>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest">REGISTER</h3>
            <p className="font-sans text-xs text-[#888888] leading-relaxed">
              Submit your work URL and SHA256 content hash. Choose license type and set royalty terms. First registration timestamp establishes priority.
            </p>
          </div>
          {/* Column 2 */}
          <div className="space-y-4">
            <div className="font-display font-bold text-4xl text-[#7c3aed]">02</div>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest">DEFINE TERMS</h3>
            <p className="font-sans text-xs text-[#888888] leading-relaxed">
              Choose from standard license frameworks: All Rights Reserved, Non-Commercial, Attribution Required, Creative Commons variants, or write custom terms.
            </p>
          </div>
          {/* Column 3 */}
          <div className="space-y-4">
            <div className="font-display font-bold text-4xl text-[#7c3aed]">03</div>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest">FILE A DISPUTE</h3>
            <p className="font-sans text-xs text-[#888888] leading-relaxed">
              If someone infringes your work, file a dispute with evidence. Pay the filing fee. Both parties submit supporting URLs.
            </p>
          </div>
          {/* Column 4 */}
          <div className="space-y-4">
            <div className="font-display font-bold text-4xl text-[#7c3aed]">04</div>
            <h3 className="text-white font-bold text-xs uppercase tracking-widest">AI ARBITRATION</h3>
            <p className="font-sans text-xs text-[#888888] leading-relaxed">
              GenLayer validators fetch and compare both works. Consensus verdict is rendered and stored on-chain. Violations trigger automatic royalty redirects.
            </p>
          </div>
        </div>
      </section>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
        <hr className="border-[#1e1e1e]" />
      </div>

      {/* Recent Disputes */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 className="font-display font-bold text-xs tracking-[0.2em] text-white uppercase">
            RECENT ARBITRATIONS
          </h2>
          <button
            onClick={() => navigateTo('disputes')}
            className="font-mono text-[10px] text-[#7c3aed] hover:underline flex items-center mt-2 sm:mt-0 uppercase font-bold"
          >
            <span>VIEW ALL DISPUTES &rarr;</span>
          </button>
        </div>

        {recentDisputes?.length === 0 ? (
          <div className="p-8 border border-[#1e1e1e] bg-[#0f0f0f] text-center">
            <span className="font-display font-bold text-xs text-[#444444] uppercase tracking-widest">
              NO DISPUTES RECORDED
            </span>
          </div>
        ) : (
          <div className="rounded-[2px] border border-[#1e1e1e] bg-[#0f0f0f] overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#1e1e1e] bg-[#141414]">
                  <th className="text-left p-4 font-mono text-[10px] text-[#444444] uppercase tracking-wider">Original Work</th>
                  <th className="text-left p-4 font-mono text-[10px] text-[#444444] uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 font-mono text-[10px] text-[#444444] uppercase tracking-wider">Verdict</th>
                  <th className="text-left p-4 font-mono text-[10px] text-[#444444] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="text-xs font-mono">
                {recentDisputes?.map((d) => (
                  
                  <tr 
                    key={d.dispute_id}
                    id={`recent_dispute_row_${d.dispute_id}`}
                    onClick={() => navigateTo('dispute-detail', { disputeId: d.dispute_id })}
                    className="border-b border-[#1e1e1e] hover:bg-[#141414] cursor-pointer"
                  >
                    <td className="p-4 text-white font-bold uppercase tracking-wide">
                      {getWorkTitle(d.original_work_id)}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(d.status)}
                    </td>
                    <td className="p-4">
                      <VerdictCell verdictId={d.verdict_id}/>
                    </td>
                    <td className="p-4 text-[#888888]">
                      {d.filed_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="w-full mt-auto bg-[#000000] border-t border-[#1e1e1e] py-12">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between text-left">
          <div className="space-y-2 mb-6 md:mb-0">
            <div className="flex items-center space-x-2.5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#7c3aed]">
                <path d="M15 5.5V9M15 5.5L19 3M15 5.5L11 3M9 11L5 15M5 15L3 17M5 15L7 13M13 13L17 17L21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/>
              </svg>
              <span className="font-display font-bold text-white text-sm uppercase tracking-tight">
                CopyrightArena
              </span>
            </div>
            <p className="font-sans text-[10px] text-[#444444] uppercase tracking-wider">
              Decentralized On-Chain Intellectual Property Court. Running on GenLayer Studionet.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] text-[#888888] uppercase tracking-wider">
            <a href="#registry" className="hover:text-white transition-colors duration-150">Registry</a>
            <a href="#disputes" className="hover:text-white transition-colors duration-150">Disputes</a>
            <a href="#my-works" className="hover:text-white transition-colors duration-150">Dashboard</a>
            <span className="text-[#444444]">v1.0.0-STUDIONET</span>
          </div>
        </div>
      </footer>
    </div>
  );
};


function VerdictCell({ verdictId }: { verdictId: string }) {
  const { data: verdict, isLoading } = useGetVerdict(verdictId);
    const getVerdictBadge = (verdict: any) => {
    if (!verdict) return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#444444]/10 text-[#888888] border border-[#444444]/20 rounded-none">PENDING</span>;
    
    switch (verdict.verdict_type) {
      case 'violation_found':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20 rounded-none">VIOLATION FOUND</span>;
      case 'PARTIAL_VIOLATION':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 rounded-none">PARTIAL VIOLATION</span>;
      case 'NO_VIOLATION':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 rounded-none">NO VIOLATION</span>;
      default:
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#6b7280]/10 text-[#6b7280] border border-[#6b7280]/20 rounded-none">INCONCLUSIVE</span>;
    }
  };


  if (isLoading)
    return (
      <span className="text-[#666] text-xs">
        Loading...
      </span>
    );

  return getVerdictBadge(verdict);
}