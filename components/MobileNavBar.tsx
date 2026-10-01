'use client';

import React from 'react';
import { Zap, Mic, Compass, Sliders, Settings } from 'lucide-react';
import { soundManager } from '@/lib/audio';

interface MobileNavBarProps {
  currentView: 'cockpit' | 'input' | 'missions' | 'ledger';
  onViewChange: (view: 'cockpit' | 'input' | 'missions' | 'ledger') => void;
  onOpenSettings: () => void;
  pendingCount: number;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  currentView,
  onViewChange,
  onOpenSettings,
  pendingCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-xl px-3 py-2 flex items-center justify-around shadow-2xl">
      {/* Cockpit */}
      <button
        onClick={() => { soundManager.playTap(); onViewChange('cockpit'); }}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
          currentView === 'cockpit' ? 'text-indigo-400 font-bold' : 'text-slate-400'
        }`}
      >
        <Zap className="w-5 h-5" />
        <span className="text-[10px]">Cockpit</span>
        {pendingCount > 0 && (
          <span className="absolute top-0 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Voice Directive / Input Stream */}
      <button
        onClick={() => { soundManager.playTap(); onViewChange('input'); }}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          currentView === 'input' ? 'text-purple-400 font-bold' : 'text-slate-400'
        }`}
      >
        <Mic className="w-5 h-5" />
        <span className="text-[10px]">Direct</span>
      </button>

      {/* Missions */}
      <button
        onClick={() => { soundManager.playTap(); onViewChange('missions'); }}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          currentView === 'missions' ? 'text-indigo-400 font-bold' : 'text-slate-400'
        }`}
      >
        <Compass className="w-5 h-5" />
        <span className="text-[10px]">Missions</span>
      </button>

      {/* Ledger */}
      <button
        onClick={() => { soundManager.playTap(); onViewChange('ledger'); }}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          currentView === 'ledger' ? 'text-indigo-400 font-bold' : 'text-slate-400'
        }`}
      >
        <Sliders className="w-5 h-5" />
        <span className="text-[10px]">Ledger</span>
      </button>

      {/* Connect & Settings */}
      <button
        onClick={() => { soundManager.playTap(); onOpenSettings(); }}
        className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition"
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px]">Connect</span>
      </button>
    </nav>
  );
};
