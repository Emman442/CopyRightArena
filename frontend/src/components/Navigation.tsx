import React, { useState } from 'react';
import { useApp } from './AppContext';
import { Gavel, Menu, X, ChevronDown, LogOut, Briefcase } from 'lucide-react';
import { formatAddress, useWallet } from '../lib/genlayer/wallet';

export const Navigation: React.FC = () => {
  const { 
    currentRoute, 
    navigateTo 
  } = useApp();

  const {address: connectedWallet, connectWallet, disconnectWallet}=useWallet()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);


  const handleNavClick = (route: 'registry' | 'disputes' | 'my-works') => {
    setMobileMenuOpen(false);
    if (route === 'my-works' && !connectedWallet) {
      connectWallet()
      return;
    }
    navigateTo(route);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#000000] border-b border-[#1e1e1e] h-16 flex items-center justify-between px-4 md:px-8">
      {/* Wordmark */}
      <div 
        id="nav_wordmark"
        className="flex items-center space-x-2.5 cursor-pointer select-none"
        onClick={() => navigateTo('landing')}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0">
          <path d="M15 5.5V9M15 5.5L19 3M15 5.5L11 3M9 11L5 15M5 15L3 17M5 15L7 13M13 13L17 17L21 13" stroke="#7c3aed" strokeWidth="2" strokeLinecap="square"/>
        </svg>
        <span className="font-display font-bold text-white text-xl tracking-tight uppercase">
          CopyrightArena
        </span>
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center space-x-8">
        <button
          id="nav_btn_registry"
          onClick={() => handleNavClick('registry')}
          className={`font-display font-bold text-xs tracking-widest uppercase transition-colors duration-150 py-2 hover:text-white ${
            currentRoute === 'registry' || currentRoute === 'registry-detail' ? 'text-white border-b border-[#7c3aed]' : 'text-[#888888]'
          }`}
        >
          Registry
        </button>
        <button
          id="nav_btn_disputes"
          onClick={() => handleNavClick('disputes')}
          className={`font-display font-bold text-xs tracking-widest uppercase transition-colors duration-150 py-2 hover:text-white ${
            currentRoute === 'disputes' || currentRoute === 'dispute-detail' || currentRoute === 'file-dispute' ? 'text-white border-b border-[#7c3aed]' : 'text-[#888888]'
          }`}
        >
          Disputes
        </button>
        <button
          id="nav_btn_my_works"
          onClick={() => handleNavClick('my-works')}
          className={`font-display font-bold text-xs tracking-widest uppercase transition-colors duration-150 py-2 hover:text-white ${
            currentRoute === 'my-works' ? 'text-white border-b border-[#7c3aed]' : 'text-[#888888]'
          }`}
        >
          My Works
        </button>

        {/* Wallet Connect Button / Pill */}
        {connectedWallet ? (
          <div className="relative">
            <button
              id="nav_wallet_pill"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="font-mono text-xs px-4 py-2.5 bg-[#0f0f0f] border border-[#7c3aed] text-[#a78bfa] flex items-center space-x-2 rounded-none hover:bg-[#141414] transition-colors duration-150 cursor-pointer uppercase tracking-wider"
            >
              <span>{formatAddress(connectedWallet)}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {dropdownOpen && (
              <div 
                id="nav_wallet_dropdown"
                className="absolute right-0 mt-2 w-48 bg-[#0f0f0f] border border-[#1e1e1e] py-1 z-50 rounded-none shadow-none"
              >
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigateTo('my-works');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#888888] hover:text-white hover:bg-[#0a0a0a] transition-colors duration-150 flex items-center space-x-2"
                >
                  <Briefcase className="w-4 h-4 text-[#7c3aed]" />
                  <span>My Dashboard</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    disconnectWallet();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-mono uppercase tracking-wider text-[#888888] hover:text-red-500 hover:bg-[#0a0a0a] transition-colors duration-150 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            id="nav_connect_wallet_btn"
            onClick={() => connectWallet()}
            className="font-mono text-xs px-5 py-2.5 bg-[#7c3aed] text-white font-bold transition-all duration-150 hover:bg-[#6d28d9] active:scale-95 uppercase tracking-wider"
            style={{ borderRadius: '0px' }}
          >
            CONNECT WALLET
          </button>
        )}
      </div>

      {/* Mobile Hamburger */}
      <button
        id="nav_mobile_hamburger"
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden text-[#888888] hover:text-white p-1"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Drawer (Full Screen Black Overlay) */}
      {mobileMenuOpen && (
        <div 
          id="nav_mobile_drawer"
          className="fixed inset-0 bg-[#000000] z-50 flex flex-col px-6 py-8"
        >
          {/* Top Bar inside Drawer */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center space-x-2.5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0">
                <path d="M15 5.5V9M15 5.5L19 3M15 5.5L11 3M9 11L5 15M5 15L3 17M5 15L7 13M13 13L17 17L21 13" stroke="#7c3aed" strokeWidth="2" strokeLinecap="square"/>
              </svg>
              <span className="font-display font-bold text-white text-xl uppercase tracking-tight">
                CopyrightArena
              </span>
            </div>
            <button
              id="nav_mobile_close"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#888888] hover:text-white p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Links */}
          <div className="flex flex-col space-y-8 text-left">
            <button
              onClick={() => handleNavClick('registry')}
              className={`font-display font-bold text-2xl text-left tracking-wide ${
                currentRoute === 'registry' ? 'text-[#7c3aed]' : 'text-white'
              }`}
            >
              Registry
            </button>
            <button
              onClick={() => handleNavClick('disputes')}
              className={`font-display font-bold text-2xl text-left tracking-wide ${
                currentRoute === 'disputes' ? 'text-[#7c3aed]' : 'text-white'
              }`}
            >
              Disputes
            </button>
            <button
              onClick={() => handleNavClick('my-works')}
              className={`font-display font-bold text-2xl text-left tracking-wide ${
                currentRoute === 'my-works' ? 'text-[#7c3aed]' : 'text-white'
              }`}
            >
              My Works
            </button>

            <div className="pt-8 border-t border-[#1e1e1e]">
              {connectedWallet ? (
                <div className="space-y-4">
                  <div className="font-mono text-sm text-[#888888] bg-[#0f0f0f] p-3 border border-[#1e1e1e]">
                    {connectedWallet}
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      disconnectWallet();
                    }}
                    className="w-full font-sans text-sm text-center py-3 border border-[#dc2626] text-[#dc2626] hover:bg-red-950 transition-colors duration-150"
                    style={{ borderRadius: '0px' }}
                  >
                    DISCONNECT WALLET
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    connectWallet()
                  }}
                  className="w-full font-sans text-sm font-bold text-center py-3 bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                  style={{ borderRadius: '0px' }}
                >
                  CONNECT WALLET
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
