'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Shield, ShieldAlert, Settings, Sliders, MessageSquare, RotateCcw } from 'lucide-react';
import { soundManager } from '@/lib/audio';

interface TopBarProps {
  emergencyMode: boolean;
  onToggleEmergency: () => void;
  onOpenLedger: () => void;
  onOpenConnect: () => void;
  isWhatsAppConnected?: boolean;
  isGoogleConnected?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  emergencyMode,
  onToggleEmergency,
  onOpenLedger,
  onOpenConnect,
  isWhatsAppConnected,
  isGoogleConnected,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmergencyClick = () => {
    const nextState = !emergencyMode;
    soundManager.playEmergencyChime(nextState);
    onToggleEmergency();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-4 py-2.5">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* App Logo & Connected Indicators */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-md shadow-indigo-500/20 text-sm">
            ⚡
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black tracking-tight text-base sm:text-lg text-white">LifeOS</span>
            {isWhatsAppConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="WhatsApp Connected" />
            )}
            {isGoogleConnected && (
              <span className="w-2 h-2 rounded-full bg-red-400" title="Google Connected" />
            )}
          </div>
        </div>

        {/* Right Header Icons: ONLY Shield Icon + Settings Dropdown */}
        <div className="flex items-center gap-2">
          {/* Only Shield Icon (NO text label) */}
          <button
            onClick={handleEmergencyClick}
            aria-label="Emergency Sick Shield"
            title={emergencyMode ? 'Emergency Shield Active (Click to Stand Down)' : 'Activate Emergency Sick Shield'}
            className={`p-2 rounded-xl transition duration-200 border ${
              emergencyMode
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-900/50 animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            {emergencyMode ? <ShieldAlert className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </button>

          {/* Settings Dropdown Button */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => { soundManager.playTap(); setIsDropdownOpen(!isDropdownOpen); }}
              aria-label="Settings and Ledger Menu"
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800 transition"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-1.5 z-50 text-xs font-semibold animate-fade-in">
                <button
                  onClick={() => {
                    soundManager.playTap();
                    setIsDropdownOpen(false);
                    onOpenLedger();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition"
                >
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Activity Ledger</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playTap();
                    setIsDropdownOpen(false);
                    onOpenConnect();
                  }}
                  className="w-full px-3.5 py-2.5 text-left text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Connect WhatsApp & Google</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
