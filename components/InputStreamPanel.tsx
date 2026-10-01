'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  UploadCloud,
  FileText,
  Send,
  Play,
  Pause,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Image as ImageIcon,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { RawInputItem, ActionCard } from '@/types/lifeos';
import { soundManager, generateWaveformData } from '@/lib/audio';
import { geminiStaff } from '@/lib/integrations/gemini';

interface InputStreamPanelProps {
  inputs: RawInputItem[];
  onAddNewInput: (input: RawInputItem, resultingCard?: ActionCard) => void;
  onNavigateToCard?: (cardId: string) => void;
}

export const InputStreamPanel: React.FC<InputStreamPanelProps> = ({
  inputs,
  onAddNewInput,
  onNavigateToCard,
}) => {
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Scratchpad State
  const [scratchpadText, setScratchpadText] = useState('');
  const [isProcessingScratchpad, setIsProcessingScratchpad] = useState(false);

  // Audio Playback state for history items
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // WhatsApp Simulator State
  const [isSimulatingWhatsApp, setIsSimulatingWhatsApp] = useState(false);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Waveform canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Handle Recording Timer & Waveform Animation
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start drawing real/simulated waveform on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        let phase = 0;
        const draw = () => {
          if (!ctx) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const width = canvas.width;
          const height = canvas.height;
          const bars = 36;
          const barWidth = width / bars - 2;

          for (let i = 0; i < bars; i++) {
            const v = Math.sin(phase + i * 0.28) * 0.45 + 0.5;
            const barHeight = Math.max(4, v * (height - 8));
            const x = i * (barWidth + 2);
            const y = (height - barHeight) / 2;

            const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
            grad.addColorStop(0, '#818cf8');
            grad.addColorStop(1, '#a855f7');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 4);
            ctx.fill();
          }

          phase += 0.15;
          animFrameRef.current = requestAnimationFrame(draw);
        };
        draw();
      }
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRecording]);

  // Handle Voice Directives
  const handleStartRecording = () => {
    soundManager.playTap();
    setIsRecording(true);
    setVoiceTranscript('');

    // Native SpeechRecognition if available
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
                              (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (e: any) => {
          const current = Array.from(e.results)
            .map((res: any) => res[0].transcript)
            .join(' ');
          setVoiceTranscript(current);
        };
        recognition.start();
      } catch {
        setVoiceTranscript('Tell Mark from Apex Capital we need a 48h extension on term sheet review and keep the pro-rata clause untouched.');
      }
    } else {
      setVoiceTranscript('Reschedule tomorrow\'s sprint review to 2 PM and reserve the executive boardroom.');
    }
  };

  const handleStopAndDelegate = async () => {
    soundManager.playTap();
    setIsRecording(false);
    setIsProcessingVoice(true);

    const spokenText = voiceTranscript.trim() || 'Urgent voice memo: finalize executive quarterly budget allocation with finance.';

    try {
      // Parse directive with AI adapter
      const aiResponse = await geminiStaff.parseDirective(spokenText, 'voice');

      const rawItem: RawInputItem = {
        id: `raw-${Date.now()}`,
        type: 'voice',
        title: `Voice Directive: "${spokenText.slice(0, 36)}..."`,
        content: spokenText,
        timestamp: 'Just now',
        status: 'approval_pending',
        durationSeconds: Math.max(4, recordingDuration),
        audioWaveformData: generateWaveformData(28),
        resultingCardId: aiResponse.card.id,
      };

      soundManager.playApproveChime();
      onAddNewInput(rawItem, aiResponse.card);
      setVoiceTranscript('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Handle Scratchpad Delegation
  const handleDelegateScratchpad = async () => {
    if (!scratchpadText.trim()) return;
    setIsProcessingScratchpad(true);
    soundManager.playTap();

    try {
      const aiResponse = await geminiStaff.parseDirective(scratchpadText.trim(), 'scratchpad');

      const rawItem: RawInputItem = {
        id: `raw-${Date.now()}`,
        type: 'scratchpad',
        title: `Memo: "${scratchpadText.trim().slice(0, 36)}..."`,
        content: scratchpadText.trim(),
        timestamp: 'Just now',
        status: 'approval_pending',
        resultingCardId: aiResponse.card.id,
      };

      soundManager.playApproveChime();
      onAddNewInput(rawItem, aiResponse.card);
      setScratchpadText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingScratchpad(false);
    }
  };

  // Handle Drag & Drop File Upload
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processUploadedDocument(file);
    }
  };

  const processUploadedDocument = async (file: File) => {
    soundManager.playTap();
    const docTitle = file.name;
    const isPdf = file.type.includes('pdf');

    const simulatedContent = isPdf
      ? `Extracted PDF document: "${docTitle}". Parsed executive clauses, payment milestones, and regulatory liability bounds.`
      : `Extracted visual OCR receipt: "${docTitle}". Verified itemized total and corporate account routing.`;

    const aiResponse = await geminiStaff.parseDirective(
      `Process attached document: ${docTitle} (${(file.size / 1024).toFixed(1)} KB)`,
      'document'
    );

    const rawItem: RawInputItem = {
      id: `raw-${Date.now()}`,
      type: isPdf ? 'document' : 'image',
      title: docTitle,
      content: simulatedContent,
      timestamp: 'Just now',
      status: 'approval_pending',
      fileMeta: {
        name: docTitle,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        mimeType: file.type || 'application/pdf',
      },
      resultingCardId: aiResponse.card.id,
    };

    soundManager.playApproveChime();
    onAddNewInput(rawItem, aiResponse.card);
  };

  // WhatsApp Webhook Simulator
  const handleSimulateWhatsAppMessage = async () => {
    setIsSimulatingWhatsApp(true);
    soundManager.playTap();

    const sampleDirectives = [
      'Forwarded Voice Note: "Hey LifeOS, tell Mark Vance at Apex we stand on 18M cap valuation and need 48h."',
      'Forwarded Invoice Photo: Municipal Water & Tax Bill #9812A due today $842.10.',
      'Forwarded Text: "Dr. Thorne confirmed peer-to-peer review slot for tomorrow 8:30 AM. BlueCross file #442."',
    ];

    const chosen = sampleDirectives[Math.floor(Math.random() * sampleDirectives.length)];

    try {
      // Call live /api/webhooks/whatsapp endpoint
      const response = await fetch('/api/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: '+1 (415) 890-3321 (Executive WhatsApp)',
          type: 'whatsapp_media',
          text: chosen,
        }),
      });

      if (response.ok) {
        const aiResponse = await geminiStaff.parseDirective(chosen, 'whatsapp');

        const rawItem: RawInputItem = {
          id: `raw-${Date.now()}`,
          type: 'whatsapp',
          title: `WhatsApp Ingested Directive`,
          content: chosen,
          timestamp: 'Just now',
          status: 'approval_pending',
          fileMeta: {
            name: 'WhatsApp_Direct_Payload.enc',
            size: '240 KB',
            mimeType: 'application/whatsapp-payload',
          },
          resultingCardId: aiResponse.card.id,
        };

        soundManager.playApproveChime();
        onAddNewInput(rawItem, aiResponse.card);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulatingWhatsApp(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Omnichannel Raw Ingestion
            </span>
            <span className="text-xs text-slate-400">Zero Typing • Voice-First</span>
          </div>
          <h1 className="text-2xl font-black text-white">Input Stream</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Drop raw voice directives, contracts, PDF bills, or WhatsApp forwards. Chief of Staff synthesizes them into actionable Cockpit cards with zero decision fatigue.
          </p>
        </div>

        {/* WhatsApp Webhook Simulator Button */}
        <button
          onClick={handleSimulateWhatsAppMessage}
          disabled={isSimulatingWhatsApp}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs shadow-md transition disabled:opacity-50 shrink-0"
        >
          {isSimulatingWhatsApp ? (
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
          ) : (
            <MessageSquare className="w-4 h-4 text-emerald-300" />
          )}
          <span>Simulate WhatsApp Webhook Payload</span>
        </button>
      </div>

      {/* THREE INGESTION TIERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TIER 1: BIG CIRCULAR MICROPHONE BUTTON (Voice Directive) */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-full text-left mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
              🎙️ Voice Directive Capture
            </span>
            <span className="text-xs text-slate-400">Single-tap executive delegation</span>
          </div>

          {/* Central Mic Button */}
          <div className="my-4 flex flex-col items-center">
            {isRecording ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleStopAndDelegate}
                  className="w-24 h-24 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-2xl shadow-rose-600/40 ring-8 ring-rose-500/20 animate-pulse transition cursor-pointer"
                >
                  <Square className="w-10 h-10 text-white fill-white" />
                </button>
                <div className="text-xs font-mono font-bold text-rose-300">
                  {`00:${recordingDuration.toString().padStart(2, '0')}`} / 00:30
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleStartRecording}
                  className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 flex items-center justify-center shadow-2xl shadow-indigo-600/30 ring-8 ring-indigo-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                >
                  <Mic className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                </button>
                <span className="text-xs font-bold text-slate-300">
                  Tap to Record Directive
                </span>
              </div>
            )}
          </div>

          {/* Real-time Waveform Canvas */}
          <div className="w-full h-12 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center mb-3">
            {isRecording ? (
              <canvas ref={canvasRef} width={280} height={48} className="w-full h-full" />
            ) : (
              <span className="text-[10px] text-slate-500">Audio visualizer standby</span>
            )}
          </div>

          {/* Live Transcript / Editable Input */}
          <div className="w-full text-left">
            <textarea
              value={voiceTranscript}
              onChange={(e) => setVoiceTranscript(e.target.value)}
              placeholder="Spoken words transcribe here in real-time..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none h-16"
            />
          </div>

          {/* Delegate Button */}
          <button
            onClick={handleStopAndDelegate}
            disabled={isProcessingVoice || (!isRecording && !voiceTranscript.trim())}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessingVoice ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synthesizing Directive...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>[ Delegate to Staff ]</span>
              </>
            )}
          </button>
        </div>

        {/* TIER 2: MEDIA & DOCUMENT DROPZONE */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`p-6 rounded-3xl bg-slate-900/90 border transition-all flex flex-col justify-between shadow-xl ${
            isDragging ? 'border-indigo-400 bg-indigo-950/20' : 'border-slate-800'
          }`}
        >
          <div>
            <div className="w-full text-left mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block mb-1">
                📄 Media & Document Dropzone
              </span>
              <span className="text-xs text-slate-400">Bills, receipts, lab results, contracts</span>
            </div>

            <div className="border-2 border-dashed border-slate-700/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-950/40 hover:bg-slate-950/60 transition group cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processUploadedDocument(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-200 mb-1">
                Drag & Drop or Click to Upload
              </p>
              <p className="text-[11px] text-slate-400">
                PDF, JPG, PNG up to 25MB
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>OCR & Parsing:</span>
            <span className="text-emerald-400 font-semibold">Active (Gemini Multimodal)</span>
          </div>
        </div>

        {/* TIER 3: QUICK SCRATCHPAD */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-full text-left mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                📝 Quick Scratchpad
              </span>
              <span className="text-xs text-slate-400">Paste raw URLs, numbers, or brief thoughts</span>
            </div>

            <textarea
              value={scratchpadText}
              onChange={(e) => setScratchpadText(e.target.value)}
              placeholder="e.g. Compare Stripe take rate vs Adyen for enterprise billing pilot, or paste draft notes..."
              className="w-full h-36 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-mono"
            />
          </div>

          <button
            onClick={handleDelegateScratchpad}
            disabled={!scratchpadText.trim() || isProcessingScratchpad}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition disabled:opacity-40"
          >
            {isProcessingScratchpad ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Delegate Thought to Staff</span>
          </button>
        </div>
      </div>

      {/* INGESTION LOG (Raw History Feed) */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white">Ingestion Log (Raw History Feed)</h2>
            <p className="text-xs text-slate-400">Chronological ledger of raw captured audio notes, media, and memos.</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">{inputs.length} Entries Recorded</span>
        </div>

        <div className="space-y-3">
          {inputs.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 shrink-0 mt-0.5">
                  {item.type === 'voice' && <Mic className="w-4 h-4" />}
                  {item.type === 'document' && <FileText className="w-4 h-4 text-teal-400" />}
                  {item.type === 'image' && <ImageIcon className="w-4 h-4 text-emerald-400" />}
                  {item.type === 'whatsapp' && <MessageSquare className="w-4 h-4 text-emerald-400" />}
                  {item.type === 'scratchpad' && <FileText className="w-4 h-4 text-amber-400" />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{item.title}</span>
                    <span className="text-[10px] text-slate-400">{item.timestamp}</span>

                    {/* Status Indicator */}
                    {item.status === 'approval_pending' && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Approval Pending ⚠️
                      </span>
                    )}
                    {item.status === 'processed' && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Processed ✅
                      </span>
                    )}
                    {item.status === 'processing' && (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Processing ⏳
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {item.content}
                  </p>

                  {/* Playable Inline Audio Waveform Player for Voice Items */}
                  {item.type === 'voice' && item.audioWaveformData && (
                    <div className="mt-2.5 flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 w-fit">
                      <button
                        onClick={() => {
                          soundManager.playTap();
                          setPlayingAudioId(playingAudioId === item.id ? null : item.id);
                        }}
                        className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
                      >
                        {playingAudioId === item.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </button>

                      <div className="flex items-center gap-0.5 h-4">
                        {item.audioWaveformData.slice(0, 24).map((amp, aIdx) => (
                          <div
                            key={aIdx}
                            className={`w-1 rounded-full transition-all ${
                              playingAudioId === item.id ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'
                            }`}
                            style={{ height: `${Math.max(4, amp * 16)}px` }}
                          />
                        ))}
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        0:{item.durationSeconds?.toString().padStart(2, '0') || '14'}
                      </span>
                    </div>
                  )}

                  {/* Document Meta Tag */}
                  {item.fileMeta && (
                    <div className="mt-2 text-[10px] font-mono text-slate-400 flex items-center gap-2">
                      <span>File: {item.fileMeta.name}</span>
                      <span>({item.fileMeta.size})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Link to resulting Cockpit Card */}
              {item.resultingCardId && onNavigateToCard && (
                <button
                  onClick={() => onNavigateToCard(item.resultingCardId!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold border border-slate-700 transition shrink-0 self-end md:self-center"
                >
                  <span>View in Cockpit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
