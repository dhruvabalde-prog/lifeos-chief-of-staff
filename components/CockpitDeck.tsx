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
  FileText,
  Mail,
  Receipt,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  RotateCcw,
  Zap,
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

  // Filter based on Emergency Mode (Keystone only when emergency active) and category
  const filteredCards = cards.filter((c) => {
    if (c.status !== 'pending') return false;
    if (emergencyMode && !c.isKeystone) return false;
    if (selectedCategory === 'all') return true;
    return c.category === selectedCategory;
  });

  // Calculate dynamic category counts
  const categoryCounts = {
    all: cards.filter((c) => c.status === 'pending' && (!emergencyMode || c.isKeystone)).length,
    responses: cards.filter((c) => c.status === 'pending' && c.category === 'responses' && (!emergencyMode || c.isKeystone)).length,
    artifacts: cards.filter((c) => c.status === 'pending' && c.category === 'artifacts' && (!emergencyMode || c.isKeystone)).length,
    protocols: cards.filter((c) => c.status === 'pending' && c.category === 'protocols' && (!emergencyMode || c.isKeystone)).length,
    lifeops: cards.filter((c) => c.status === 'pending' && c.category === 'lifeops' && (!emergencyMode || c.isKeystone)).length,
  };

  // Safe active card bounds
  const activeCard: ActionCard | undefined = filteredCards[Math.min(currentIndex, Math.max(0, filteredCards.length - 1))];

  const handleNext = () => {
    soundManager.playTap();
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    soundManager.playTap();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(filteredCards.length - 1);
    }
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

  const executeDraft = () => {
    if (!activeCard) return;
    soundManager.playTap();
    onSaveToDrafts(activeCard);
  };

  const executeKill = () => {
    if (!activeCard) return;
    soundManager.playTap();
    onKillMission(activeCard);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. STICKY PIN FILTER BAR */}
      <div className="w-full max-w-4xl mb-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { soundManager.playTap(); setSelectedCategory('all'); setCurrentIndex(0); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-slate-100 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>All</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'all' ? 'bg-slate-300 text-slate-900' : 'bg-slate-800 text-slate-400'
              }`}>
                {categoryCounts.all}
              </span>
            </button>

            <button
              onClick={() => { soundManager.playTap(); setSelectedCategory('responses'); setCurrentIndex(0); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'responses'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>💬 Responses</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'responses' ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {categoryCounts.responses}
              </span>
            </button>

            <button
              onClick={() => { soundManager.playTap(); setSelectedCategory('artifacts'); setCurrentIndex(0); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'artifacts'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>📄 Artifacts</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'artifacts' ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {categoryCounts.artifacts}
              </span>
            </button>

            <button
              onClick={() => { soundManager.playTap(); setSelectedCategory('protocols'); setCurrentIndex(0); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'protocols'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>🛡️ Protocols</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'protocols' ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {categoryCounts.protocols}
              </span>
            </button>

            <button
              onClick={() => { soundManager.playTap(); setSelectedCategory('lifeops'); setCurrentIndex(0); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'lifeops'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>⚡ Life Ops</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'lifeops' ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {categoryCounts.lifeops}
              </span>
            </button>
          </div>

          {filteredCards.length > 1 && (
            <div className="flex items-center gap-1 pr-1 shrink-0">
              <span className="text-[11px] font-bold text-slate-400 px-2">
                {currentIndex + 1} of {filteredCards.length}
              </span>
              <button
                onClick={handlePrev}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Previous Card"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Next Card"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. SINGLE-CARD VIEWPORT DECK CONTAINER (Strict: EXACTLY 1 card occupies the screen) */}
      <div className="w-full max-w-4xl min-h-[480px] flex items-center justify-center">
        {filteredCards.length === 0 ? (
          // CALM EMPTY STATE
          <div className="w-full py-16 px-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/5">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white mb-2">
              Zero Pending Approvals
            </h3>
            <p className="text-sm text-slate-400 max-w-md mb-6">
              All systems operational. Chief of Staff is monitoring background streams, flight trackers, and incoming communication channels.
            </p>
            {onResetDemoCards && (
              <button
                onClick={() => { soundManager.playTap(); onResetDemoCards(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition shadow-sm"
              >
                <RotateCcw className="w-4 h-4 text-indigo-400" />
                <span>Reload Executive Demo Deck</span>
              </button>
            )}
          </div>
        ) : activeCard ? (
          // THE ACTIVE ACTION CARD
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl shadow-slate-950/80 relative flex flex-col justify-between transition-all duration-300">
            {/* Ambient Category Header */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-extrabold tracking-wider px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeCard.categoryLabel}
                  </span>

                  {activeCard.isKeystone && (
                    <span className="text-xs font-extrabold tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>*KEYSTONE*</span>
                    </span>
                  )}

                  {activeCard.urgency === 'critical' && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      CRITICAL
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  {activeCard.targetEntity && (
                    <span className="text-slate-300 mr-2 bg-slate-800/80 px-2 py-0.5 rounded">
                      To: {activeCard.targetEntity}
                    </span>
                  )}
                  <span>Card {currentIndex + 1} of {filteredCards.length}</span>
                </div>
              </div>

              {/* Source Context */}
              <div className="text-xs text-slate-400 font-medium mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>{activeCard.sourceContext}</span>
              </div>

              {/* Headline & Synthesis */}
              <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight mb-3 leading-snug">
                {activeCard.headline}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed mb-5 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/60 font-medium">
                {activeCard.synthesis}
              </p>

              {/* INTERACTIVE PREVIEW DRAWER (Collapsible) */}
              <div className="mb-6">
                <button
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-300 hover:text-indigo-200 transition py-1"
                >
                  {isPreviewOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>{isPreviewOpen ? 'Hide Draft Preview' : 'Expand Draft & Data Preview'}</span>
                </button>

                {isPreviewOpen && (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 font-mono overflow-x-auto max-h-64 shadow-inner">
                    {activeCard.previewType === 'email' && (
                      <div className="space-y-2">
                        <div className="text-slate-400 border-b border-slate-800 pb-1 font-sans font-semibold">
                          <span className="text-slate-500">To:</span> {activeCard.previewData.to || 'Recipient'} <br />
                          <span className="text-slate-500">Subject:</span> {activeCard.previewData.subject || 'Directives'}
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-xs text-slate-200 pt-1 leading-relaxed">
                          {activeCard.previewData.body}
                        </pre>
                      </div>
                    )}

                    {activeCard.previewType === 'document' && (
                      <div className="space-y-3 font-sans">
                        <div className="font-bold text-white text-sm border-b border-slate-800 pb-1">
                          {activeCard.previewData.docTitle}
                        </div>
                        {activeCard.previewData.sections?.map((sec, sIdx) => (
                          <div key={sIdx} className="space-y-1">
                            <div className="font-semibold text-indigo-300 text-xs">{sec.title}</div>
                            <div className="text-slate-300 text-xs leading-relaxed">{sec.content}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeCard.previewType === 'invoice' && (
                      <div className="space-y-3 font-sans">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div>
                            <span className="font-bold text-white">{activeCard.previewData.vendor}</span>
                            <span className="text-slate-400 text-[11px] block">{activeCard.previewData.invoiceNumber}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-extrabold text-emerald-400">{activeCard.previewData.amount}</span>
                            <span className="text-slate-400 text-[11px] block">Due: {activeCard.previewData.dueDate}</span>
                          </div>
                        </div>
                        <div className="space-y-1 pt-1">
                          {activeCard.previewData.lineItems?.map((li, lIdx) => (
                            <div key={lIdx} className="flex justify-between text-slate-300 text-xs py-0.5">
                              <span>{li.desc}</span>
                              <span className="font-semibold text-slate-200">{li.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 3. THE 5-ACTION DECISION PALETTE (Non-Binary Controls) */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 relative">
              {/* PRIMARY: Approve & Execute */}
              <button
                onClick={executeApproval}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>🚀 Approve & Execute</span>
              </button>

              {/* SECONDARY ROW */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                {/* Snooze / Defer with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { soundManager.playTap(); setIsSnoozeOpen(!isSnoozeOpen); }}
                    className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700/80 transition"
                  >
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>🕒 Snooze</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isSnoozeOpen && (
                    <div className="absolute bottom-full mb-2 left-0 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-30 font-semibold text-xs">
                      <button
                        onClick={() => executeSnooze('Tonight 8 PM')}
                        className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        Tonight 8:00 PM
                      </button>
                      <button
                        onClick={() => executeSnooze('Tomorrow 9 AM')}
                        className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        Tomorrow 9:00 AM
                      </button>
                      <button
                        onClick={() => executeSnooze('This Weekend')}
                        className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        This Weekend
                      </button>
                      <button
                        onClick={() => executeSnooze('Next Month')}
                        className="w-full px-3 py-2 text-left text-slate-300 hover:bg-slate-800 hover:text-white transition"
                      >
                        Next Month
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Critique (5s Voice Capture) */}
                <button
                  onClick={() => { soundManager.playTap(); setIsCritiqueOpen(true); }}
                  className="flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold text-xs border border-purple-500/40 transition shadow-sm"
                  title="Speak 5s critique to re-draft in place"
                >
                  <Mic className="w-4 h-4 text-purple-300" />
                  <span>🎙️ Critique</span>
                </button>

                {/* Save to Drafts / Manual */}
                <button
                  onClick={executeDraft}
                  className="flex items-center gap-1.5 px-3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold text-xs border border-slate-700 transition"
                  title="Move to native drafts, release agent control"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span className="hidden md:inline">Save Draft</span>
                </button>

                {/* Kill Mission */}
                <button
                  onClick={executeKill}
                  className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition"
                  title="Kill Mission & Record Negative Preference"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Quick Critique Modal */}
      <QuickCritiqueModal
        card={activeCard || null}
        isOpen={isCritiqueOpen}
        onClose={() => setIsCritiqueOpen(false)}
        onCritiqueApplied={(updated) => {
          onCritiqueUpdate(updated);
        }}
      />
    </div>
  );
};
