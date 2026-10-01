'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Mic,
  FolderArchive,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { ActionCard, ActionCategory } from '@/types/lifeos';
import { soundManager } from '@/lib/audio';
import { QuickCritiqueModal } from './QuickCritiqueModal';

interface CockpitDeckProps {
  cards: ActionCard[];
  emergencyMode: boolean;
  onApprove: (card: ActionCard) => void;
  onSnooze: (card: ActionCard, deferLabel: string) => void;
  onCritiqueUpdate: (updatedCard: ActionCard) => void;
  onSaveToDrafts: (card: ActionCard) => void;
  onKillMission: (card: ActionCard) => void;
  onResetDemoCards?: () => void;
}

export const CockpitDeck: React.FC<CockpitDeckProps> = ({
  cards,
  emergencyMode,
  onApprove,
  onSnooze,
  onCritiqueUpdate,
  onSaveToDrafts,
  onKillMission,
  onResetDemoCards,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isSnoozeOpen, setIsSnoozeOpen] = useState(false);
  const [isCritiqueOpen, setIsCritiqueOpen] = useState(false);

  // Filter based on Emergency Mode and category
  const filteredCards = cards.filter((c) => {
    if (c.status !== 'pending') return false;
    if (emergencyMode && !c.isKeystone) return false;
    if (selectedCategory === 'all') return true;
    return c.category === selectedCategory;
  });

  const categoryCounts = {
    all: cards.filter((c) => c.status === 'pending' && (!emergencyMode || c.isKeystone)).length,
    responses: cards.filter((c) => c.status === 'pending' && c.category === 'responses' && (!emergencyMode || c.isKeystone)).length,
    artifacts: cards.filter((c) => c.status === 'pending' && c.category === 'artifacts' && (!emergencyMode || c.isKeystone)).length,
    protocols: cards.filter((c) => c.status === 'pending' && c.category === 'protocols' && (!emergencyMode || c.isKeystone)).length,
    lifeops: cards.filter((c) => c.status === 'pending' && c.category === 'lifeops' && (!emergencyMode || c.isKeystone)).length,
  };

  const activeCard: ActionCard | undefined = filteredCards[Math.min(currentIndex, Math.max(0, filteredCards.length - 1))];

  const handleNext = () => {
    soundManager.playTap();
    setCurrentIndex((prev) => (prev < filteredCards.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    soundManager.playTap();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : filteredCards.length - 1));
  };

  const executeApproval = () => {
    if (!activeCard) return;
    soundManager.playApproveChime();
    onApprove(activeCard);
  };

  const executeSnooze = (label: string) => {
    if (!activeCard) return;
    soundManager.playTap();
    setIsSnoozeOpen(false);
    onSnooze(activeCard, label);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. STICKY PIN FILTER BAR */}
      <div className="w-full max-w-2xl mb-3">
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto p-1 rounded-2xl bg-slate-900 border border-slate-800 no-scrollbar">
          <div className="flex items-center gap-1">
            <button
              onClick={() => { soundManager.playTap(); setSelectedCategory('all'); setCurrentIndex(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'all' ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({categoryCounts.all})
            </button>
            <button
              onClick={() => { soundManager.playTap(); setSelectedCategory('responses'); setCurrentIndex(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'responses' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              💬 Responses ({categoryCounts.responses})
            </button>
            <button
              onClick={() => { soundManager.playTap(); setSelectedCategory('artifacts'); setCurrentIndex(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'artifacts' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              📄 Artifacts ({categoryCounts.artifacts})
            </button>
            <button
              onClick={() => { soundManager.playTap(); setSelectedCategory('protocols'); setCurrentIndex(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'protocols' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ Protocols ({categoryCounts.protocols})
            </button>
            <button
              onClick={() => { soundManager.playTap(); setSelectedCategory('lifeops'); setCurrentIndex(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'lifeops' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Life Ops ({categoryCounts.lifeops})
            </button>
          </div>

          {filteredCards.length > 1 && (
            <div className="flex items-center gap-1 shrink-0 pr-1">
              <span className="text-[11px] font-mono text-slate-400">
                {currentIndex + 1}/{filteredCards.length}
              </span>
              <button
                onClick={handlePrev}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. THE SINGLE ACTION CARD (Strict: 1 card occupies viewport) */}
      <div className="w-full max-w-2xl min-h-[380px] flex items-center justify-center">
        {filteredCards.length === 0 ? (
          <div className="w-full py-12 px-6 rounded-3xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              Zero Pending Approvals
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              All delegated tasks are clear. Background agents monitoring.
            </p>
            {onResetDemoCards && (
              <button
                onClick={() => { soundManager.playTap(); onResetDemoCards(); }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Reload Cards</span>
              </button>
            )}
          </div>
        ) : activeCard ? (
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col justify-between">
            <div>
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeCard.categoryLabel}
                  </span>
                  {activeCard.isKeystone && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> *KEYSTONE*
                    </span>
                  )}
                  {activeCard.urgency === 'critical' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      CRITICAL
                    </span>
                  )}
                </div>

                {activeCard.targetEntity && (
                  <span className="text-[11px] font-medium text-slate-400 truncate max-w-[150px]">
                    To: {activeCard.targetEntity}
                  </span>
                )}
              </div>

              {/* Headline */}
              <h2 className="text-lg sm:text-xl font-black text-white leading-snug mb-2">
                {activeCard.headline}
              </h2>

              {/* Synthesis */}
              <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
                {activeCard.synthesis}
              </p>

              {/* Collapsible Preview Drawer */}
              <div className="mb-5">
                <button
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                >
                  {isPreviewOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{isPreviewOpen ? 'Hide Draft Preview' : 'Show Draft Preview'}</span>
                </button>

                {isPreviewOpen && (
                  <div className="mt-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 max-h-56 overflow-y-auto">
                    {activeCard.previewType === 'email' && (
                      <div className="space-y-1.5 font-sans">
                        <div className="text-slate-400 text-[11px]">
                          <strong>To:</strong> {activeCard.previewData.to || 'Recipient'} | <strong>Subject:</strong> {activeCard.previewData.subject || 'Directives'}
                        </div>
                        <pre className="whitespace-pre-wrap text-slate-200 text-xs font-sans pt-1">
                          {activeCard.previewData.body}
                        </pre>
                      </div>
                    )}

                    {activeCard.previewType === 'document' && (
                      <div className="space-y-2">
                        <div className="font-bold text-white">{activeCard.previewData.docTitle}</div>
                        {activeCard.previewData.sections?.map((sec, sIdx) => (
                          <div key={sIdx}>
                            <div className="font-semibold text-indigo-300 text-[11px]">{sec.title}</div>
                            <div className="text-slate-300 text-xs">{sec.content}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeCard.previewType === 'invoice' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                          <span className="font-bold text-white">{activeCard.previewData.vendor}</span>
                          <span className="font-bold text-emerald-400">{activeCard.previewData.amount}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">Due: {activeCard.previewData.dueDate}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. 5-ACTION DECISION PALETTE (Mobile-First Thumb Friendly) */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              {/* PRIMARY: Approve & Execute */}
              <button
                onClick={executeApproval}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>🚀 Approve & Execute</span>
              </button>

              {/* SECONDARY PALETTE ROW */}
              <div className="grid grid-cols-4 gap-1.5 relative">
                {/* Snooze */}
                <div className="relative">
                  <button
                    onClick={() => { soundManager.playTap(); setIsSnoozeOpen(!isSnoozeOpen)} }
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Snooze</span>
                  </button>

                  {isSnoozeOpen && (
                    <div className="absolute bottom-full mb-2 left-0 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-30 text-xs font-semibold">
                      <button onClick={() => executeSnooze('Tonight 8 PM')} className="w-full px-3 py-2 text-left hover:bg-slate-800 text-slate-300">Tonight 8 PM</button>
                      <button onClick={() => executeSnooze('Tomorrow 9 AM')} className="w-full px-3 py-2 text-left hover:bg-slate-800 text-slate-300">Tomorrow 9 AM</button>
                      <button onClick={() => executeSnooze('This Weekend')} className="w-full px-3 py-2 text-left hover:bg-slate-800 text-slate-300">This Weekend</button>
                      <button onClick={() => executeSnooze('Next Month')} className="w-full px-3 py-2 text-left hover:bg-slate-800 text-slate-300">Next Month</button>
                    </div>
                  )}
                </div>

                {/* Critique */}
                <button
                  onClick={() => { soundManager.playTap(); setIsCritiqueOpen(true); }}
                  className="py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold flex items-center justify-center gap-1 border border-purple-500/30 transition"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Critique</span>
                </button>

                {/* Draft */}
                <button
                  onClick={() => { soundManager.playTap(); onSaveToDrafts(activeCard); }}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>Draft</span>
                </button>

                {/* Kill */}
                <button
                  onClick={() => { soundManager.playTap(); onKillMission(activeCard); }}
                  className="py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center justify-center gap-1 border border-rose-500/20 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Kill</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <QuickCritiqueModal
        card={activeCard || null}
        isOpen={isCritiqueOpen}
        onClose={() => setIsCritiqueOpen(false)}
        onCritiqueApplied={(updated) => onCritiqueUpdate(updated)}
      />
    </div>
  );
};
