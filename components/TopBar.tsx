'use client';

import React from 'react';
import { Shield, ShieldAlert, Sparkles, Settings } from 'lucide-react';
import { soundManager } from '@/lib/audio';

interface TopBarProps {
  currentView: 'cockpit' | 'input' | 'missions' | 'ledger';
  onViewChange: (view: 'cockpit' | 'input' | 'missions' | 'ledger') => void;
  emergencyMode: boolean;
  onToggleEmergency: () => void;
  pendingCardCount: number;
  onOpenSettings: () => void;
  isGoogleConnected?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onViewChange,
  emergencyMode,
  onToggleEmergency,
  pendingCardCount,
  onOpenSettings,
  isGoogleConnected,
}) => {
  const handleEmergencyClick = () => {
    const nextState = !emergencyMode;
    soundManager.playEmergencyChime(nextState);
    onToggleEmergency();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-lg px-3 sm:px-6 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Connection Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white shadow-md shadow-indigo-500/20 text-sm">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-base sm:text-lg text-white">LifeOS</span>
              {isGoogleConnected && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Google Linked
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Desktop View Switcher */}
        <nav className="hidden md:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => { soundManager.playTap(); onViewChange('cockpit'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              currentView === 'cockpit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚡ The Cockpit</span>
            {pendingCardCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-bold">
                {pendingCardCount}
              </span>
            )}
          </button>
          <button
            onClick={() => { soundManager.playTap(); onViewChange('input'); }}
            className={`px-3 py-1.5 rounded-lg transition ${
              currentView === 'input' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            📥 Input Stream
          </button>
          <button
            onClick={() => { soundManager.playTap(); onViewChange('missions'); }}
            className={`px-3 py-1.5 rounded-lg transition ${
              currentView === 'missions' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 Missions
          </button>
          <button
            onClick={() => { soundManager.playTap(); onViewChange('ledger'); }}
            className={`px-3 py-1.5 rounded-lg transition ${
              currentView === 'ledger' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            📜 Ledger
          </button>
        </nav>

        {/* Right Action Controls: Connect + Emergency Shield */}
        <div className="flex items-center gap-2">
          {/* Connect Accounts Button */}
          <button
            onClick={() => { soundManager.playTap(); onOpenSettings(); }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
            title="Configure Google OAuth, WhatsApp, and Gemini Key"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Connect Accounts</span>
          </button>

          {/* Emergency Shield Toggle */}
          <button
            onClick={handleEmergencyClick}
            aria-label="Toggle Sick Shield"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              emergencyMode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-md shadow-rose-900/40 animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {emergencyMode ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <Shield className="w-4 h-4" />}
            <span>{emergencyMode ? 'Shield ON' : 'Sick Shield'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
