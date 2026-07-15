import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { ChevronLeft, HelpCircle, Shield, Key, CheckCircle2 } from 'lucide-react';
import { ContentType, LicenseType } from '../lib/contracts/types';
import { useWallet } from '../lib/genlayer/wallet';
import { useRegisterWork } from '../lib/hooks/useCopyRightArena';
import { sha256 } from '../lib/utils';

export const RegisterWorkPage: React.FC = () => {
  const {
    navigateTo,
    addToast
  } = useApp();

  const { address: connectedWallet, connectWallet } = useWallet()
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<ContentType>('image');
  const [description, setDescription] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [transcriptUrl, setTranscriptUrl] = useState('');
  const [contentHash, setContentHash] = useState('');
  const [licenseType, setLicenseType] = useState<LicenseType>('all_rights_reserved');
  const [licenseDescription, setLicenseDescription] = useState('');
  const [royaltyPercentage, setRoyaltyPercentage] = useState(10);
  const [royaltyPaymentAddress, setRoyaltyPaymentAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isPending: isRegisteringWork, mutate: registerWork } = useRegisterWork()

  useEffect(() => {
    if (connectedWallet && !royaltyPaymentAddress) {
      setRoyaltyPaymentAddress(connectedWallet);
    }
  }, [connectedWallet, royaltyPaymentAddress]);

  // Pre-populate license descriptions when license type changes
  useEffect(() => {
    const terms: Record<LicenseType, string> = {
      all_rights_reserved: 'All Rights Reserved. Any redistribution, commercial utilization, adaptation, or performance of this content without prior written authorization from the copyright holder is strictly prohibited.',
      non_commercial: 'Non-Commercial License. You are free to share, copy, and redistribute the material in any medium or format, provided it is for non-commercial purposes only and attribution is maintained.',
      attribution_required: 'Attribution Required. Redistribution, public display, or commercial adaptation is permitted, provided that appropriate credit is given to the original creator and changes are indicated.',
      no_derivatives: 'No Derivatives License. The work must be redistributed in its exact original state. No alterations, mashups, remixes, or derivative creations are permitted under any circumstances.',
      creative_commons_by: 'Creative Commons Attribution (CC BY). This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator.',
      creative_commons_by_nc: 'Creative Commons Attribution-NonCommercial (CC BY-NC). This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, so long as attribution is given.',
      creative_commons_by_nd: 'Creative Commons Attribution-NoDerivatives (CC BY-ND). This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, so long as attribution is given.',
      creative_commons_by_sa: 'Creative Commons Attribution-ShareAlike (CC BY-SA). This license allows reusers to distribute, remix, adapt, and build upon the material, so long as attribution is given and modified works are shared under identical terms.'
    };
    setLicenseDescription(terms[licenseType]);
  }, [licenseType]);

  const handleGenerateHash = async () => {
  if (!contentUrl) {
    addToast(
      "URL Required",
      "Please enter a Content URL first.",
      "warning"
    );
    return;
  }

  const hash = await sha256(contentUrl);

  setContentHash(hash);

  addToast(
    "SHA256 Computed",
    "Content hash generated successfully.",
    "success"
  );
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedWallet) {
      connectWallet()
      return;
    }

    if (!title.trim() || !contentUrl.trim() || !contentHash.trim()) {
      addToast('Missing Required Fields', 'Title, Content URL, and SHA256 Hash are required.', 'error');
      return;
    }

    if (contentHash.trim().length !== 64) {
      addToast('Invalid Hash', 'SHA256 hashes must be exactly 64 hexadecimal characters.', 'error');
      return;
    }

    registerWork({
      title: title,
      description: description,
      contentType: contentType,
      contentUrl: contentUrl,
      transcriptUrl: transcriptUrl,
      contentHash: contentHash,
      licenseType: licenseType,
      licenseDescription: licenseDescription,
      royaltyPercentage: royaltyPercentage,
      revenueAddress: royaltyPaymentAddress
    }, {
      onSuccess: () => {
        addToast("Creative Work Registered!", "Creative Work Registered successfully", "success")
      },
      onError: (error: any) => {
        addToast('Registration Failed', error.message || 'Server error', 'error');
      }
    })
  };

  const licenseOptions: Array<{ value: LicenseType; label: string }> = [
    { value: 'all_rights_reserved', label: 'All Rights Reserved' },
    { value: 'non_commercial', label: 'Non-Commercial' },
    { value: 'attribution_required', label: 'Attribution Required' },
    { value: 'no_derivatives', label: 'No Derivatives' },
    { value: 'creative_commons_by', label: 'Creative Commons BY' },
    { value: 'creative_commons_by_nc', label: 'Creative Commons BY-NC' },
    { value: 'creative_commons_by_nd', label: 'Creative Commons BY-ND' },
    { value: 'creative_commons_by_sa', label: 'Creative Commons BY-SA' }
  ];

  return (
    <div id="register_work_page" className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 text-left">
      {/* Back button */}
      <button
        onClick={() => navigateTo('my-works')}
        className="flex items-center text-[#888888] hover:text-white font-mono text-[10px] tracking-wider uppercase mb-8 transition-colors duration-150"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </button>

      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight">
          REGISTER CREATIVE WORK
        </h1>
        <p className="font-sans text-xs text-[#888888] mt-1">
          Secure content priority, licensing models, and on-chain royalty structures.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN - Form */}
        <div className="lg:col-span-2">
          {!connectedWallet ? (
            <div className="border border-[#1e1e1e] bg-[#0f0f0f] p-8 text-center space-y-4">
              <Shield className="w-10 h-10 text-[#7c3aed] mx-auto" />
              <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">
                WALLET REGISTRATION LOCKED
              </h3>
              <p className="font-sans text-xs text-[#888888] max-w-sm mx-auto">
                Connect your GenLayer wallet session to cryptographically sign content metadata and secure registration timestamps under your owner address.
              </p>
              <button
                onClick={() => connectWallet()}
                className="px-6 py-3 bg-[#7c3aed] text-white font-bold text-xs uppercase"
                style={{ borderRadius: '0px' }}
              >
                CONNECT WALLET
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 bg-[#0a0a0a] border border-[#1e1e1e] p-6">
              {/* TITLE & CONTENT TYPE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="block font-mono text-[9px] text-[#a78bfa] uppercase tracking-wider font-semibold">
                    WORK TITLE (REQUIRED)
                  </label>
                  <input
                    id="register_title_input"
                    type="text"
                    required
                    placeholder="e.g. Moonlight Master Compositions"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full font-sans text-xs p-3 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                    style={{ borderRadius: '0px' }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[9px] text-[#a78bfa] uppercase tracking-wider font-semibold">
                    CONTENT TYPE
                  </label>
                  <select
                    id="register_type_select"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="w-full bg-black text-white text-xs font-sans border border-[#1e1e1e] p-3 focus:border-[#7c3aed] focus:outline-none"
                    style={{ borderRadius: '0px' }}
                  >
                    <option value="IMAGE">IMAGE / ARTWORK</option>
                    <option value="AUDIO">AUDIO CLIP</option>
                    <option value="VIDEO">VIDEO / FILM</option>
                    <option value="TEXT">TEXT / WRITING</option>
                    <option value="MUSIC">MUSIC COMPOSITION</option>
                  </select>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-1">
                <label className="block font-mono text-[9px] text-[#a78bfa] uppercase tracking-wider font-semibold">
                  WORK DESCRIPTION / SUMMARY
                </label>
                <textarea
                  id="register_desc_input"
                  placeholder="Describe your creative work, details of composition, artistic notes, or summaries. This helps AI consensus agents compare content contextually."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full font-sans text-xs p-3 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed] leading-relaxed"
                  style={{ borderRadius: '0px' }}
                />
              </div>

              {/* CONTENT URL & TRANSCRIPT URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-mono text-[9px] text-[#a78bfa] uppercase tracking-wider font-semibold">
                    PUBLIC CONTENT URL (REQUIRED)
                  </label>
                  <input
                    id="register_url_input"
                    type="url"
                    required
                    placeholder="https://ipfs.io/ipfs/Qm..."
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    className="w-full font-mono text-xs p-3 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                    style={{ borderRadius: '0px' }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[9px] text-[#888888] uppercase tracking-wider">
                    TRANSCRIPT / TEXT SUMMARY URL (OPTIONAL)
                  </label>
                  <input
                    id="register_transcript_input"
                    type="url"
                    placeholder="Recommended for audio/video comparative accuracy"
                    value={transcriptUrl}
                    onChange={(e) => setTranscriptUrl(e.target.value)}
                    className="w-full font-mono text-xs p-3 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                    style={{ borderRadius: '0px' }}
                  />
                </div>
              </div>

              {/* CRYPTOGRAPHIC CONTENT HASH */}
              <div className="space-y-2 pt-2 border-t border-[#1e1e1e]">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-[9px] text-[#a78bfa] uppercase tracking-wider font-semibold">
                    CONTENT SHA256 HASH (REQUIRED)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateHash}
                    className="font-sans text-[10px] text-[#a78bfa] hover:text-white uppercase tracking-wider"
                  >
                    GENERATE SHA256 FROM URL ⚡
                  </button>
                </div>
                <input
                  id="register_hash_input"
                  type="text"
                  required
                  placeholder="Paste 64-character SHA256 hex string..."
                  value={contentHash}
                  onChange={(e) => setContentHash(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                  style={{ borderRadius: '0px' }}
                />
                <p className="font-sans text-[10px] text-[#444444]">
                  This establishes immutable proof of your asset's exact contents. The AI jury uses this hash to confirm that disputes target the exact same file.
                </p>
              </div>

              {/* LICENSE SELECTION & ROYALTY */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#1e1e1e]">
                <div className="space-y-1">
                  <label className="block font-mono text-[9px] text-[#a78bfa] uppercase tracking-wider font-semibold">
                    LICENSE MODEL
                  </label>
                  <select
                    id="register_license_select"
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value as LicenseType)}
                    className="w-full bg-black text-white text-xs font-sans border border-[#1e1e1e] p-3 focus:border-[#7c3aed] focus:outline-none"
                    style={{ borderRadius: '0px' }}
                  >
                    {licenseOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[9px] text-[#a78bfa] uppercase tracking-wider font-semibold">
                    ROYALTY REDIRECT FEE (%)
                  </label>
                  <div className="relative">
                    <input
                      id="register_royalty_input"
                      type="number"
                      min="0"
                      max="100"
                      value={royaltyPercentage}
                      onChange={(e) => setRoyaltyPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full font-mono text-xs p-3 bg-black border border-[#1e1e1e] text-white focus:border-[#7c3aed]"
                      style={{ borderRadius: '0px' }}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 font-mono text-xs text-[#888888]">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-mono text-[9px] text-[#888888] uppercase tracking-wider">
                    PAYMENT GATEWAY ADDRESS
                  </label>
                  <input
                    id="register_payment_gateway"
                    type="text"
                    placeholder="Defaults to your wallet"
                    value={royaltyPaymentAddress}
                    onChange={(e) => setRoyaltyPaymentAddress(e.target.value)}
                    className="w-full font-mono text-xs p-3 bg-black border border-[#1e1e1e] text-[#888888] focus:border-[#7c3aed] truncate"
                    style={{ borderRadius: '0px' }}
                  />
                </div>
              </div>

              {/* LICENSE DESCRIPTION TEXT */}
              <div className="space-y-1">
                <label className="block font-mono text-[9px] text-[#888888] uppercase tracking-wider">
                  LICENSE LEGAL CONTRACT TEXT
                </label>
                <textarea
                  id="register_license_desc"
                  value={licenseDescription}
                  onChange={(e) => setLicenseDescription(e.target.value)}
                  rows={4}
                  className="w-full font-mono text-xs p-3 bg-black border border-[#1e1e1e] text-[#888888] focus:border-[#7c3aed] leading-relaxed"
                  style={{ borderRadius: '0px' }}
                />
              </div>

              {/* EXECUTE REGISTRATION BUTTON */}
              <button
                id="execute_register_btn"
                type="submit"
                disabled={isRegisteringWork}
                className="w-full font-sans font-bold text-sm py-4 bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-all duration-150 active:scale-97 disabled:opacity-50 uppercase tracking-wider"
                style={{ borderRadius: '0px' }}
              >
                {isRegisteringWork ? 'SIGNING & EXECUTING TRANSACTION...' : 'EXECUTE ON-CHAIN REGISTRATION'}
              </button>
            </form>
          )}
        </div>

        {/* RIGHT COLUMN - Legal Guide */}
        <div className="bg-[#0f0f0f] border border-[#1e1e1e] p-6 space-y-6">
          <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
            REGISTRATION MANUAL
          </h3>
          <div className="space-y-4 text-xs text-[#888888] leading-relaxed text-left">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#7c3aed] mt-0.5 flex-shrink-0" />
              <p>
                <strong>Priority Timestamping:</strong> Registrations establish priority of creation on-chain. If another work registers later, your timestamp is primary evidence.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#7c3aed] mt-0.5 flex-shrink-0" />
              <p>
                <strong>SHA256 Content Lock:</strong> This system uses zero-knowledge verification. Only the hash is immutable on-chain; your content remains on IPFS or your private server.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#7c3aed] mt-0.5 flex-shrink-0" />
              <p>
                <strong>Consensus Arbitrations:</strong> If your work is infringed, AI validators compare hashes and textual summaries dynamically on-chain to redirect royalty splits automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
