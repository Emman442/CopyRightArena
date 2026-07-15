import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { Search, Info, AlertTriangle } from 'lucide-react';
import { ContentType, LicenseType } from '../lib/contracts/types';
import { useGetAllWorks } from '../lib/hooks/useCopyRightArena';

export const RegistryPage: React.FC = () => {
  const { navigateTo} = useApp();
  const { data: works } = useGetAllWorks()
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedLicense, setSelectedLicense] = useState<string>('All Licenses');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredWorks, setFilteredWorks] = useState(works);

  const contentTypes = ['a;;', 'image', 'audio', 'video', 'text', 'music'];
  const licenseOptions = [
    'All Licenses',
    'ALL_RIGHTS_RESERVED',
    'NON_COMMERCIAL',
    'ATTRIBUTION_REQUIRED',
    'NO_DERIVATIVES',
    'CC_BY',
    'CC_BY_NC',
    'CC_BY_ND',
    'CC_BY_SA'
  ];


  // Map database keys to human labels for the filter dropdown
  const getLicenseLabel = (type: string) => {
    switch (type) {
      case 'All Licenses': return 'All Licenses';
      case 'ALL_RIGHTS_RESERVED': return 'All Rights Reserved';
      case 'NON_COMMERCIAL': return 'Non-Commercial';
      case 'ATTRIBUTION_REQUIRED': return 'Attribution Required';
      case 'NO_DERIVATIVES': return 'No Derivatives';
      case 'CC_BY': return 'Creative Commons BY';
      case 'CC_BY_NC': return 'Creative Commons BY-NC';
      case 'CC_BY_ND': return 'Creative Commons BY-ND';
      case 'CC_BY_SA': return 'Creative Commons BY-SA';
      default: return type;
    }
  };

  useEffect(() => {
   let result = works ? [...works] : [];

    if (selectedType !== 'ALL') {
      result = result.filter(w => w.content_type === selectedType);
    }

    if (selectedLicense !== 'All Licenses') {
      result = result.filter(w => w.license_type === selectedLicense);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(w =>
        w.title.toLowerCase().includes(q) ||
        w.creator.toLowerCase().includes(q) ||
        w.content_hash.toLowerCase().includes(q)
      );
    }

    setFilteredWorks(result);
  }, [works, selectedType, selectedLicense, searchQuery]);

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
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

  return (
    <div id="registry_page" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 text-left">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight">
          WORK REGISTRY
        </h1>
        <p className="font-sans text-xs text-[#888888] mt-1">
          All registered creative works on CopyrightArena.
        </p>
      </div>

      {/* Filter Row */}
      <div className="space-y-4 mb-8">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#444444]" />
          <input
            id="registry_search"
            type="text"
            placeholder="Search by title, creator, or content hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-black border border-[#1e1e1e] text-white placeholder-[#444444] text-xs font-sans hover:border-[#2d2d2d] focus:border-[#7c3aed] transition-colors duration-150"
            style={{ borderRadius: '0px' }}
          />
        </div>

        {/* Content Type pills & License select */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Pills */}
          <div className="flex flex-wrap gap-2">
            {contentTypes.map((type) => (
              <button
                key={type}
                id={`pill_${type}`}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 font-display font-bold text-[10px] tracking-wider uppercase transition-all duration-150 ${selectedType === type
                    ? 'bg-[#7c3aed] text-white border border-[#7c3aed]'
                    : 'bg-[#0f0f0f] text-[#888888] border border-[#1e1e1e] hover:border-[#2d2d2d]'
                  }`}
                style={{ borderRadius: '0px' }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* License select */}
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[9px] text-[#888888] uppercase tracking-wider">FILTER LICENSE:</span>
            <select
              id="registry_license_filter"
              value={selectedLicense}
              onChange={(e) => setSelectedLicense(e.target.value)}
              className="bg-black text-white text-xs font-sans border border-[#1e1e1e] p-2 hover:border-[#2d2d2d] focus:border-[#7c3aed] focus:outline-none"
              style={{ borderRadius: '0px' }}
            >
              {licenseOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#0f0f0f] text-white">
                  {getLicenseLabel(opt)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredWorks?.length === 0 ? (
        <div id="registry_empty_state" className="py-24 text-center border border-[#1e1e1e] bg-[#0f0f0f]">
          <span className="font-display font-bold text-xs text-[#444444] uppercase tracking-widest block">
            NO WORKS FOUND
          </span>
          <span className="font-sans text-[10px] text-[#444444] uppercase tracking-wider block mt-2">
            Try adjusting filters or search queries
          </span>
        </div>
      ) : (
        <div
          id="works_grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredWorks?.map((w: any) => (
            <div
              key={w.work_id}
              id={`work_card_${w.work_id}`}
              onClick={() => navigateTo('registry-detail', { workId: w.work_id })}
              className="group bg-[#0f0f0f] border border-[#1e1e1e] p-5 hover:border-[#2d2d2d] transition-all duration-150 cursor-pointer flex flex-col justify-between"
              style={{ borderRadius: '2px' }}
            >
              <div>
                {/* Badge Row */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display font-bold text-[9px] text-[#a78bfa] tracking-wider uppercase">
                    {w.content_type}
                  </span>
                  {getStatusBadge(w.status)}
                </div>

                {/* Title */}
                <h3 className="font-display font-bold text-base text-white group-hover:text-[#a78bfa] transition-colors duration-150 line-clamp-2 uppercase tracking-wide text-left mb-2 leading-snug">
                  {w.title}
                </h3>

                {/* Creator address */}
                <div className="font-mono text-[10px] text-[#888888] text-left mb-4">
                  {formatAddress(w.creator)}
                </div>

                {/* License term and date */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="font-mono text-[8px] border border-[#1e1e1e] text-[#888888] px-2 py-0.5 uppercase tracking-wide bg-[#0a0a0a]">
                    {getLicenseLabel(w.license_type)}
                  </span>
                  <span className="font-sans text-[9px] text-[#444444] mt-0.5">
                    Registered {w.registered_at}
                  </span>
                </div>

                {/* Content Hash */}
                <div className="font-mono text-[8px] text-[#444444] text-left border-t border-[#1e1e1e] pt-3 mb-3 truncate">
                  SHA256: {w.content_hash}
                </div>
              </div>

              {/* Bottom Row */}
              <div className="flex items-center justify-between border-t border-[#1e1e1e] pt-3 mt-2">
                <div>
                  {w.dispute_ids.length > 0 && (
                    <span className="font-sans text-[9px] font-bold text-[#f59e0b] tracking-wide flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      {w.dispute_ids.length} {w.dispute_ids.length === 1 ? 'dispute' : 'disputes'}
                    </span>
                  )}
                </div>
                <span className="font-sans text-[10px] font-bold text-[#a78bfa] group-hover:text-white transition-colors duration-150 uppercase tracking-widest">
                  VIEW WORK →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
