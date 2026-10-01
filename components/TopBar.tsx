'use client';

import React from 'react';
import { Shield, ShieldAlert, Sparkles, SlidersHorizontal } from 'lucide-react';
import { soundManager } from '@/lib/audio';

interface TopBarProps {
  currentView: 'cockpit' | 'input' | 'missions' | 'ledger';
  onViewChange: (view: 'cockpit' | 'input' | 'missions' | 'ledger') => void;
  emergencyMode: boolean;
  onToggleEmergency: () => void;
  pendingCardCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onViewChange,
  emergencyMode,
  onToggleEmergency,
  pendingCardCount,
}) => {
  const handleEmergencyClick = () => {
    const nextState = !emergencyMode;
    soundManager.playEmergencyChime(nextState);
    onToggleEmergency();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: App Logo & Live Status */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-slate-900 border border-indigo-400/30 shadow-lg shadow-indigo-500/10">
              <Sparkles className="w-5 h-5 text-indigo-100" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-agent-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-xl text-white">LifeOS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
                  Chief of Staff
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-medium text-emerald-400">Agent Synced & Ready</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 text-[11px]">Gemini 1.5</span>
              </div>
            </div>
          </div>

          {/* Mobile Emergency Toggle Button */}
          <div className="md:hidden">
            <button
              onClick={handleEmergencyClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                emergencyMode
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 animate-pulse'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              {emergencyMode ? <ShieldAlert className="w-4 h-4 text-rose-400" /> : <Shield className="w-4 h-4 text-slate-400" />}
              <span>{emergencyMode ? 'Shield ON' : 'Shield'}</span>
            </button>
          </div>
        </div>

        {/* Center: View Switcher */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shadow-inner w-full md:w-auto justify-center overflow-x-auto">
          <button
            onClick={() => { soundManager.playTap(); onViewChange('cockpit'); }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'cockpit'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>⚡ The Cockpit</span>
            {pendingCardCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                currentView === 'cockpit' ? 'bg-indigo-900/80 text-indigo-200' : 'bg-slate-800 text-slate-300'
              }`}>
                {pendingCardCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { soundManager.playTap(); onViewChange('input'); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'input'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>📥 Input Stream</span>
          </button>

          <button
            onClick={() => { soundManager.playTap(); onViewChange('missions'); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'missions'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>🎯 Missions & Goals</span>
          </button>

          <button
            onClick={() => { soundManager.playTap(); onViewChange('ledger'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentView === 'ledger'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>
        </nav>

        {/* Right: Emergency / Sick Mode High-Visibility Toggle */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative group">
            <button
              onClick={handleEmergencyClick}
              aria-label="Toggle Emergency or Sick Shield"
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
                emergencyMode
                  ? 'bg-rose-500/20 text-rose-200 border-rose-500 shadow-lg shadow-rose-500/20 ring-2 ring-rose-500/30'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:border-slate-500 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className={`p-1 rounded-md ${emergencyMode ? 'bg-rose-500/40' : 'bg-slate-800'}`}>
                {emergencyMode ? (
                  <ShieldAlert className="w-4 h-4 text-rose-300 animate-bounce" />
                ) : (
                  <Shield className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 leading-none">
                  Shield Mode
                </span>
                <span className={`text-xs font-bold leading-tight ${emergencyMode ? 'text-rose-300' : 'text-slate-200'}`}>
                  {emergencyMode ? '🚨 SICK SHIELD ON' : 'Normal Operations'}
                </span>
              </div>
              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${emergencyMode ? 'bg-rose-500' : 'bg-slate-700'}`}>
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${emergencyMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
