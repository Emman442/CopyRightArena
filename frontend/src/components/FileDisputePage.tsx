import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { ChevronLeft, Plus, Trash2, Wallet, AlertTriangle, HelpCircle } from 'lucide-react';
import { useFileDispute, useGetAllWorks } from '../lib/hooks/useCopyRightArena';
import { useWallet } from '../lib/genlayer/wallet';

export const FileDisputePage: React.FC = () => {
  const { 
    navigateTo, 
    addToast 
  } = useApp();
  const {isPending: isFilingDispute, mutate: fileDispute} = useFileDispute()
  const {data: works} = useGetAllWorks()
  const {address: connectedWallet, connectWallet} = useWallet()
  const [selectedOriginalWorkId, setSelectedOriginalWorkId] = useState('');
  const [infringingWorkIdInput, setInfringingWorkIdInput] = useState('');
  const [complaintText, setComplaintText] = useState('');
  const [evidenceItems, setEvidenceItems] = useState<Array<{ url: string; title: string; description: string }>>([
    { url: '', title: '', description: '' }
  ]);
  // Get works owned by the connected wallet
  const myRegisteredWorks = works?.filter(
    (w) => w.creator.toLowerCase() === connectedWallet?.toLowerCase()
  );

  // Find infringing work if ID is valid
  const infringingWork = works?.find(w => w.work_id === infringingWorkInputCleaned());

  function infringingWorkInputCleaned() {
    return infringingWorkIdInput.trim();
  }

  // Pre-fill original work if there's only one or pre-select first
  useEffect(() => {
    if (myRegisteredWorks?.length > 0 && !selectedOriginalWorkId) {
      setSelectedOriginalWorkId(myRegisteredWorks[0]?.work_id);
    }
  }, [myRegisteredWorks, selectedOriginalWorkId]);

  const selectedOriginalWork = works?.find(w => w.work_id === selectedOriginalWorkId);

  const handleAddEvidence = () => {
    setEvidenceItems([...evidenceItems, { url: '', title: '', description: '' }]);
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceItems(evidenceItems.filter((_, i) => i !== index));
  };

  const handleEvidenceChange = (index: number, field: 'url' | 'title' | 'description', value: string) => {
    const updated = [...evidenceItems];
    updated[index][field] = value;
    setEvidenceItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedWallet) {
      connectWallet()
      return;
    }

    if (!selectedOriginalWorkId) {
      addToast('Error', 'Please select one of your registered works as the original.', 'error');
      return;
    }

    if (!infringingWork) {
      addToast('Error', 'Please enter a valid infringing work ID from the registry.', 'error');
      return;
    }

    if (selectedOriginalWorkId === infringingWork.work_id) {
      addToast('Error', 'You cannot file a dispute against the same work.', 'error');
      return;
    }

    if (!complaintText.trim()) {
      addToast('Error', 'Please describe the infringement details for the AI consensus validators.', 'error');
      return;
    }

      // const validEvidence = evidenceItems.filter(ev => ev.url.trim() !== '');
      
      fileDispute({
        originalWorkId: selectedOriginalWorkId,
        infringingWorkId: infringingWork.work_id,
        description: complaintText,
      }, {
        onSuccess: ()=>{
          addToast("Dispute filed successfully", "You've successfully filed a dispute!", "success")
          navigateTo('disputes');
        },
        onError: (err)=>{
          addToast("Dispute filed successfully", err.message || "You've successfully filed a dispute!", "success")
        }
      });

      // navigateTo('dispute-detail', { disputeId: newDispute.id });
  };

  const getLicenseLabel = (type: string) => {
    switch (type) {
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

  return (
    <div id="file_dispute_page" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 text-left">
      {/* Back to disputes */}
      <button
        onClick={() => navigateTo('disputes')}
        className="flex items-center text-[#888888] hover:text-white font-mono text-[10px] tracking-wider uppercase mb-8 transition-colors duration-150"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Disputes
      </button>

      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight">
          FILE A DISPUTE
        </h1>
        <p className="font-sans text-xs text-[#888888] mt-1">
          Report copyright infringement against your registered work.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN - Form */}
        <div className="lg:col-span-2">
          {!connectedWallet ? (
            <div className="border border-[#1e1e1e] bg-[#0f0f0f] p-8 text-center space-y-4">
              <Wallet className="w-10 h-10 text-[#7c3aed] mx-auto" />
              <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">
                WALLET CONNECTION REQUIRED
              </h3>
              <p className="font-sans text-xs text-[#888888] max-w-sm mx-auto">
                You must connect your GenLayer wallet session to authenticate your ownership of registered works and lock the dispute filing fee.
              </p>
              <button
                onClick={() => connectWallet()}
                className="px-6 py-3 bg-[#7c3aed] text-white font-bold text-xs uppercase"
                style={{ borderRadius: '0px' }}
              >
                CONNECT WALLET
              </button>
            </div>
          ) : myRegisteredWorks?.length === 0 ? (
            <div className="border border-[#1e1e1e] bg-[#0f0f0f] p-8 text-center space-y-4">
              <AlertTriangle className="w-10 h-10 text-[#f59e0b] mx-auto" />
              <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">
                NO REGISTERED WORKS FOUND
              </h3>
              <p className="font-sans text-xs text-[#888888] max-w-sm mx-auto">
                You do not have any registered creative works on this wallet address. You must register your work first before filing an infringement claim.
              </p>
              <button
                onClick={() => navigateTo('register-work')}
                className="px-6 py-3 bg-[#7c3aed] text-white font-bold text-xs uppercase"
                style={{ borderRadius: '0px' }}
              >
                REGISTER NEW WORK NOW
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 bg-[#0a0a0a] border border-[#1e1e1e] p-6">
              {/* SECTION: YOUR WORK */}
              <div className="space-y-4">
                <label className="block font-mono text-[10px] text-[#a78bfa] uppercase tracking-widest font-semibold">
                  SELECT YOUR ORIGINAL WORK
                </label>
                <select
                  id="dispute_select_original"
                  value={selectedOriginalWorkId}
                  onChange={(e) => setSelectedOriginalWorkId(e.target.value)}
                  className="w-full bg-black text-white text-xs font-sans border border-[#1e1e1e] p-3 hover:border-[#2d2d2d] focus:border-[#7c3aed] focus:outline-none"
                  style={{ borderRadius: '0px' }}
                >
                  {myRegisteredWorks?.map((w) => (
                    <option key={w.work_id} value={w.work_id} className="bg-[#0f0f0f] text-white">
                      {w.title} ({getLicenseLabel(w.license_type)})
                    </option>
                  ))}
                </select>

                {selectedOriginalWork && (
                  <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-4 flex items-start gap-4">
                    {selectedOriginalWork.content_type === 'image' && (
                      <img 
                        src={selectedOriginalWork.content_url} 
                        alt={selectedOriginalWork.title} 
                        className="w-16 h-16 object-cover border border-[#1e1e1e] flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="text-left space-y-1">
                      <h4 className="font-display font-bold text-white text-xs uppercase tracking-wide">
                        {selectedOriginalWork.title}
                      </h4>
                      <p className="font-mono text-[10px] text-[#888888]">
                        HASH: {selectedOriginalWork.content_hash.substring(0, 16)}...
                      </p>
                      <span className="inline-block px-2 py-0.5 text-[8px] font-mono border border-[#1e1e1e] text-[#a78bfa] bg-[#0a0a0a]">
                        {getLicenseLabel(selectedOriginalWork.license_type)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: INFRINGING WORK */}
              <div className="space-y-4 pt-4 border-t border-[#1e1e1e]">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-[10px] text-[#a78bfa] uppercase tracking-widest font-semibold">
                    INFRINGING WORK ID
                  </label>
                  <button
                    type="button"
                    onClick={() => navigateTo('registry')}
                    className="font-sans text-[10px] text-[#888888] hover:text-white uppercase tracking-wider"
                  >
                    BROWSE REGISTRY TO FIND THE WORK
                  </button>
                </div>
                
                <input
                  id="dispute_infringing_input"
                  type="text"
                  placeholder="Paste work_id (e.g. work_5 or work_171042784...)"
                  value={infringingWorkIdInput}
                  onChange={(e) => setInfringingWorkIdInput(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed] placeholder-[#444444]"
                  style={{ borderRadius: '0px' }}
                />

                {infringingWork ? (
                  <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-4 flex items-start gap-4">
                    {infringingWork.content_type === 'image' && (
                      <img 
                        src={infringingWork.content_url} 
                        alt={infringingWork.title} 
                        className="w-16 h-16 object-cover border border-[#1e1e1e] flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="text-left space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-display font-bold text-white text-xs uppercase tracking-wide">
                          {infringingWork.title}
                        </h4>
                        <span className="px-1.5 py-0.5 text-[8px] font-mono bg-red-950 text-red-500">TARGET</span>
                      </div>
                      <p className="font-mono text-[10px] text-[#888888]">
                        Creator: {infringingWork.creator.substring(0, 16)}...
                      </p>
                      <a
                        href={infringingWork.content_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block font-sans text-[9px] text-[#a78bfa] hover:underline"
                      >
                        Verify Infringing Asset Content ↗
                      </a>
                    </div>
                  </div>
                ) : infringingWorkIdInput.trim() !== '' ? (
                  <div className="text-red-500 font-mono text-[10px]">
                    ✗ INVALID WORK ID. Please verify the ID against the public registry listings.
                  </div>
                ) : null}
              </div>

              {/* SECTION: YOUR COMPLAINT */}
              <div className="space-y-4 pt-4 border-t border-[#1e1e1e]">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-[10px] text-[#a78bfa] uppercase tracking-widest font-semibold">
                    DESCRIBE THE INFRINGEMENT
                  </label>
                  <span className="font-mono text-[10px] text-[#444444]">{complaintText.length} / 2000</span>
                </div>
                <textarea
                  id="dispute_complaint_text"
                  placeholder="Describe specifically how this work infringes your license. Reference the exact license terms that were violated. Be specific — the AI arbitrator reads exactly what you write."
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value.substring(0, 2000))}
                  rows={6}
                  className="w-full font-sans text-xs p-3 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed] placeholder-[#444444] leading-relaxed"
                  style={{ borderRadius: '0px' }}
                />
              </div>

              {/* SECTION: EVIDENCE */}
              <div className="space-y-4 pt-4 border-t border-[#1e1e1e]">
                <label className="block font-mono text-[10px] text-[#a78bfa] uppercase tracking-widest font-semibold">
                  SUPPORTING EVIDENCE
                </label>
                <p className="font-sans text-[11px] text-[#888888]">
                  Provide public URLs to files, creation archives, timestamps, legal papers, or summaries. AI Consensus judges pull and analyze these files.
                </p>

                <div className="space-y-4">
                  {evidenceItems.map((item, index) => (
                    <div key={index} className="bg-[#0f0f0f] border border-[#1e1e1e] p-4 space-y-3 relative">
                      {evidenceItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(index)}
                          className="absolute top-4 right-4 text-[#444444] hover:text-[#dc2626]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block font-mono text-[9px] text-[#888888] uppercase">EVIDENCE TITLE</label>
                          <input
                            type="text"
                            placeholder="e.g. Creator Layer Draft"
                            value={item.title}
                            onChange={(e) => handleEvidenceChange(index, 'title', e.target.value)}
                            className="w-full font-sans text-xs p-2.5 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                            style={{ borderRadius: '0px' }}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block font-mono text-[9px] text-[#888888] uppercase">EVIDENCE RESOURCE URL</label>
                          <input
                            type="text"
                            placeholder="https://example.com/evidence-master.png"
                            value={item.url}
                            onChange={(e) => handleEvidenceChange(index, 'url', e.target.value)}
                            className="w-full font-mono text-xs p-2.5 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                            style={{ borderRadius: '0px' }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-mono text-[9px] text-[#888888] uppercase">EXPLANATION FOR VALIDATOR</label>
                        <input
                          type="text"
                          placeholder="Explain what this file proves (e.g., initial creation timestamp metadata)"
                          value={item.description}
                          onChange={(e) => handleEvidenceChange(index, 'description', e.target.value)}
                          className="w-full font-sans text-xs p-2.5 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                          style={{ borderRadius: '0px' }}
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddEvidence}
                    className="flex items-center space-x-1 font-mono text-[10px] text-[#a78bfa] hover:text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ADD EVIDENCE URL</span>
                  </button>
                </div>
              </div>

              {/* FILING FEE REQUIRED NOTICE */}
              <div className="bg-[#141414] border border-[#2d2d2d] p-5 space-y-2">
                <div className="font-mono text-[9px] text-[#f59e0b] uppercase tracking-wider font-bold">
                  FILING FEE REQUIRED
                </div>
                <div className="font-display font-bold text-2xl text-white">
                  10 GEN
                </div>
                <p className="font-sans text-[11px] text-[#888888] leading-relaxed">
                  The filing fee is held in escrow. If your dispute is upheld, the full 10 GEN fee is returned to your wallet. If dismissed, the fee is allocated to the platform treasury.
                </p>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                id="dispute_submit_btn"
                type="submit"
                disabled={isFilingDispute}
                className="w-full font-sans font-bold text-sm py-4 bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-all duration-150 active:scale-97 disabled:opacity-50"
                style={{ borderRadius: '0px' }}
              >
                {isFilingDispute ? 'RECORDING DISPUTE TRANSACTION...' : 'SUBMIT DISPUTE'}
              </button>
            </form>
          )}
        </div>

        {/* RIGHT COLUMN - Tips */}
        <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-6 space-y-6">
          <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
            FILING TIPS
          </h3>
          <ul className="space-y-4 text-xs text-[#888888] leading-relaxed text-left list-disc pl-4">
            <li>
              Be highly specific about which clause or term of the original registration license was violated (e.g. Commercial usage under an ALL_RIGHTS_RESERVED or NON_COMMERCIAL framework).
            </li>
            <li>
              Provide direct timestamps, raw creation file exports, or digital signatures establishing priority of creation.
            </li>
            <li>
              Provide URLs that are completely public. The AI validator node fetches and reads each document.
            </li>
            <li>
              Transcripts substantially enhance arbitration confidence when comparing audio or video compositions.
            </li>
            <li>
              Unsubstantiated claims will be swiftly dismissed, resulting in loss of the filing fee.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
