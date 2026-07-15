import React, { useState } from 'react';
import { useApp } from './AppContext';
import { Wallet, Briefcase, Scale, Plus, AlertCircle, TrendingUp, ShieldCheck } from 'lucide-react';

export const MyWorksPage: React.FC = () => {
  const { 
    navigateTo, 
    works, 
    disputes, 
    connectedWallet, 
    setWalletModalOpen 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'WORKS' | 'DISPUTES'>('WORKS');

  if (!connectedWallet) {
    return (
      <div id="my_works_unconnected" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-24 text-center">
        <div className="max-w-md mx-auto border border-[#1e1e1e] bg-[#0f0f0f] p-8 space-y-6">
          <Wallet className="w-12 h-12 text-[#7c3aed] mx-auto animate-pulse" />
          <h2 className="font-display font-bold text-white text-xl tracking-wider uppercase">
            MY PORTFOLIO DASHBOARD
          </h2>
          <p className="font-sans text-xs text-[#888888] leading-relaxed">
            Connect your GenLayer wallet session to register copyright metadata, view licensing royalty redirects, and manage active litigation court cases.
          </p>
          <button
            onClick={() => setWalletModalOpen(true)}
            className="w-full font-sans font-bold text-xs py-3.5 bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-all duration-150 uppercase"
            style={{ borderRadius: '0px' }}
          >
            CONNECT WALLET
          </button>
        </div>
      </div>
    );
  }

  // Get user's registered works
  const myWorks = works.filter(
    (w) => w.creatorAddress.toLowerCase() === connectedWallet.toLowerCase()
  );

  // Get disputes where claimant OR respondent is the connected wallet
  const myDisputes = disputes.filter(
    (d) => 
      d.claimantAddress.toLowerCase() === connectedWallet.toLowerCase() ||
      works.find(w => w.id === d.infringingWorkId)?.creatorAddress.toLowerCase() === connectedWallet.toLowerCase()
  );

  // Stats computation
  const totalRegistered = myWorks.length;
  const activeDisputesCount = myDisputes.filter(d => d.status !== 'RESOLVED').length;
  
  // Sum up redirected royalty payments! Let's say each dispute records payments or we can mock/fetch it.
  // In our DB, we can just fetch it. Let's look at works where royalty redirection has happened.
  // We can also have a simulated registry balance. Let's grab total royalty redirect value from database if we wish.
  // Since we have a mock in the server state, let's keep it simple and clean! We can accumulate the royalty count.
  const resolvedDisputes = myDisputes.filter(d => d.status === 'RESOLVED');
  const totalRoyaltiesAccumulated = resolvedDisputes.reduce((acc, d) => {
    // If claimant, we won a dispute where violation was found, we got royalties.
    if (d.verdict?.verdictType !== 'NO_VIOLATION' && d.claimantAddress.toLowerCase() === connectedWallet.toLowerCase()) {
      return acc + 125; // mock dynamic earnings of 125 GEN per won dispute
    }
    return acc;
  }, 0);

  const getWorkTitle = (workId: string) => {
    return works.find(w => w.id === workId)?.title || 'Deleted/Unknown Work';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 rounded-none">ACTIVE</span>;
      case 'DISPUTED':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 rounded-none">DISPUTED</span>;
      case 'DELISTED':
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/20 rounded-none">DELISTED</span>;
      default:
        return <span className="px-2.5 py-1 text-[9px] font-mono tracking-wider font-bold bg-[#6b7280]/10 text-[#6b7280] border border-[#6b7280]/20 rounded-none">{status}</span>;
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
  };

  return (
    <div id="my_works_page" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 text-left">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight">
          MY IP DASHBOARD
        </h1>
        <p className="font-sans text-xs text-[#888888] mt-1">
          Manage registrations, royalty earnings, and ongoing disputes for your portfolio.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-5">
          <div className="font-mono text-[9px] text-[#888888] uppercase tracking-wider">SECURED ASSETS</div>
          <div className="font-display font-bold text-2xl text-white mt-1">{totalRegistered}</div>
          <div className="font-sans text-[10px] text-[#444444] mt-1 flex items-center">
            <ShieldCheck className="w-3 h-3 text-[#22c55e] mr-1" />
            <span>GenLayer Registered</span>
          </div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-5">
          <div className="font-mono text-[9px] text-[#888888] uppercase tracking-wider">ROYALTY EARNINGS</div>
          <div className="font-display font-bold text-2xl text-[#a78bfa] mt-1">{totalRoyaltiesAccumulated} GEN</div>
          <div className="font-sans text-[10px] text-[#444444] mt-1 flex items-center">
            <TrendingUp className="w-3 h-3 text-[#7c3aed] mr-1" />
            <span>Redirects Active</span>
          </div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-5">
          <div className="font-mono text-[9px] text-[#888888] uppercase tracking-wider">ACTIVE LITIGATIONS</div>
          <div className="font-display font-bold text-2xl text-white mt-1">{activeDisputesCount}</div>
          <div className="font-sans text-[10px] text-[#444444] mt-1 flex items-center">
            <AlertCircle className="w-3 h-3 text-[#f59e0b] mr-1" />
            <span>Awaiting consensus</span>
          </div>
        </div>

        <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-5">
          <div className="font-mono text-[9px] text-[#888888] uppercase tracking-wider">ESCROW BALANCE</div>
          <div className="font-display font-bold text-2xl text-white mt-1">{activeDisputesCount * 10} GEN</div>
          <div className="font-sans text-[10px] text-[#444444] mt-1">Locked dispute claims</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e1e1e] mb-8">
        <button
          id="dashboard_tab_works"
          onClick={() => setActiveTab('WORKS')}
          className={`px-6 py-3 font-display font-bold text-xs tracking-wider uppercase transition-colors duration-150 border-b-2 ${
            activeTab === 'WORKS' 
              ? 'text-white border-b-[#7c3aed]' 
              : 'text-[#888888] border-b-transparent hover:text-white'
          }`}
        >
          MY REGISTERED WORKS ({myWorks.length})
        </button>
        <button
          id="dashboard_tab_disputes"
          onClick={() => setActiveTab('DISPUTES')}
          className={`px-6 py-3 font-display font-bold text-xs tracking-wider uppercase transition-colors duration-150 border-b-2 ${
            activeTab === 'DISPUTES' 
              ? 'text-white border-b-[#7c3aed]' 
              : 'text-[#888888] border-b-transparent hover:text-white'
          }`}
        >
          MY COURT LITIGATIONS ({myDisputes.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'WORKS' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create new work trigger card */}
          <div
            id="register_new_trigger_card"
            onClick={() => navigateTo('register-work')}
            className="border-2 border-dashed border-[#1e1e1e] hover:border-[#7c3aed] p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer min-h-[220px] transition-colors duration-150"
            style={{ borderRadius: '0px' }}
          >
            <div className="p-3 bg-[#0f0f0f] border border-[#1e1e1e] text-[#7c3aed] group-hover:text-white">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display font-bold text-white text-xs tracking-wider uppercase block">
                REGISTER CREATIVE WORK
              </span>
              <span className="font-sans text-[10px] text-[#444444] uppercase tracking-wider block mt-1">
                Establish priority timestamp on-chain
              </span>
            </div>
          </div>

          {/* User's registered works */}
          {myWorks.map((w) => (
            <div
              key={w.id}
              onClick={() => navigateTo('registry-detail', { workId: w.id })}
              className="bg-[#0f0f0f] border border-[#1e1e1e] p-5 flex flex-col justify-between hover:border-[#2d2d2d] transition-all duration-150 cursor-pointer min-h-[220px]"
              style={{ borderRadius: '0px' }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display font-bold text-[9px] text-[#a78bfa] tracking-wider uppercase">
                    {w.contentType}
                  </span>
                  {getStatusBadge(w.status)}
                </div>

                <h3 className="font-display font-bold text-sm text-white line-clamp-2 uppercase tracking-wide mb-2">
                  {w.title}
                </h3>
                
                <p className="font-mono text-[10px] text-[#888888]">
                  HASH: {w.contentHash.substring(0, 16)}...
                </p>
              </div>

              <div className="border-t border-[#1e1e1e] pt-3 mt-4 flex items-center justify-between text-[10px]">
                <span className="font-mono text-[8px] bg-[#050505] border border-[#1e1e1e] text-[#888888] px-2 py-0.5">
                  {w.licenseType}
                </span>
                <span className="font-sans font-bold text-[#7c3aed] uppercase tracking-wider">
                  Details →
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* DISPUTES SUBSECTION */
        <div>
          {myDisputes.length === 0 ? (
            <div className="border border-[#1e1e1e] bg-[#0f0f0f] p-8 text-center">
              <span className="font-display font-bold text-xs text-[#444444] uppercase tracking-widest block">
                NO ACTIVE LITIGATIONS
              </span>
              <p className="font-sans text-xs text-[#444444] mt-1">
                Your portfolio is clear of active copyright disputes.
              </p>
            </div>
          ) : (
            <div className="border border-[#1e1e1e] bg-[#0a0a0a] divide-y divide-[#1e1e1e]">
              {myDisputes.map((d) => {
                const isClaimant = d.claimantAddress.toLowerCase() === connectedWallet.toLowerCase();
                const roleLabel = isClaimant ? 'CLAIMANT' : 'RESPONDENT';
                
                return (
                  <div
                    key={d.id}
                    onClick={() => navigateTo('dispute-detail', { disputeId: d.id })}
                    className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#0f0f0f] transition-colors duration-150 cursor-pointer"
                  >
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-xs text-[#7c3aed] font-bold">
                          #{d.id.substring(0, 12)}
                        </span>
                        <span className={`px-2 py-0.5 text-[8px] font-mono font-bold border ${
                          isClaimant 
                            ? 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20' 
                            : 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20'
                        } rounded-none`}>
                          {roleLabel}
                        </span>
                        {d.status === 'RESOLVED' ? (
                          <span className="px-2 py-0.5 text-[8px] font-mono font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 rounded-none">
                            {d.verdict?.verdictType.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[8px] font-mono font-bold bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 rounded-none">
                            {d.status}
                          </span>
                        )}
                      </div>

                      <div className="font-sans text-xs text-[#888888]">
                        Original: <span className="text-white font-semibold">{getWorkTitle(d.originalWorkId)}</span> • Infringing: <span className="text-white font-semibold">{getWorkTitle(d.infringingWorkId)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-xs">
                      <span className="font-mono text-[#444444]">
                        Filed {d.filedAt}
                      </span>
                      <span className="font-sans font-bold text-[#7c3aed] uppercase tracking-wider">
                        OPEN CASEROOM →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
