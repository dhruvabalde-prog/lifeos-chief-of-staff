'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Camera,
  Paperclip,
  Send,
  MessageSquare,
  User,
  ArrowRight,
  FileText,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ActionCard } from '@/types/lifeos';
import { soundManager } from '@/lib/audio';
import { geminiStaff } from '@/lib/integrations/gemini';

export interface ChatMessage {
  id: string;
  sender: 'staff' | 'user';
  text: string;
  timestamp: string;
  source?: 'whatsapp' | 'app';
  attachment?: {
    type: 'image' | 'file' | 'voice';
    name: string;
    url?: string;
  };
  spawnedCard?: ActionCard;
}

interface ChatboxHomepageProps {
  onSpawnCard: (card: ActionCard) => void;
  onNavigateToApprovals: () => void;
  isWhatsAppConnected?: boolean;
  whatsAppNumber?: string;
}

export const ChatboxHomepage: React.FC<ChatboxHomepageProps> = ({
  onSpawnCard,
  onNavigateToApprovals,
  isWhatsAppConnected,
  whatsAppNumber,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'staff',
      text: 'Good afternoon. I am your Executive Chief of Staff. 3 priority action cards are waiting in your Cockpit. Speak a voice directive, snap a bill, or message me below.',
      timestamp: 'Just now',
      source: 'app',
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastSyncedIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Poll / Sync WhatsApp Messages
  useEffect(() => {
    let isSubscribed = true;

    const syncWhatsApp = async () => {
      try {
        const url = lastSyncedIdRef.current
          ? `/api/integrations/whatsapp/sync?since=${encodeURIComponent(lastSyncedIdRef.current)}`
          : '/api/integrations/whatsapp/sync';

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0 && isSubscribed) {
            lastSyncedIdRef.current = data.lastId;

            // Merge messages that are not yet in state
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newMsgs: ChatMessage[] = [];

              for (const wm of data.messages) {
                if (!existingIds.has(wm.id)) {
                  newMsgs.push({
                    id: wm.id,
                    sender: wm.sender,
                    text: wm.text,
                    timestamp: wm.timestamp,
                    source: wm.source || 'whatsapp',
                  });
                }
              }

              return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
            });
          }
        }
      } catch (err) {
        // Non-blocking background sync
      }
    };

    // Initial sync
    syncWhatsApp();

    // Background interval sync every 6 seconds
    const interval = setInterval(syncWhatsApp, 6000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  // Helper to push to WhatsApp sync store
  const dispatchToWhatsAppMirror = async (text: string, sender: 'user' | 'staff' = 'user') => {
    try {
      await fetch('/api/integrations/whatsapp/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sender,
          source: 'app',
          senderPhone: whatsAppNumber,
        }),
      });
    } catch {
      // Non-blocking
    }
  };

  // REAL MICROPHONE RECORDING
  const handleStartRecording = async () => {
    soundManager.playTap();
    setIsRecording(true);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start(100);
        mediaRecorderRef.current = recorder;
      }
    } catch (e) {
      console.warn('Microphone error', e);
    }

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleStopRecordingAndSend = async () => {
    soundManager.playTap();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);

    let audioUrl: string | undefined = undefined;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      if (audioBlob.size > 0) {
        audioUrl = URL.createObjectURL(audioBlob);
      }
    }

    setIsProcessing(true);
    const simulatedSpoken = 'Send Apex Capital our valuation counter-offer and request a 48-hour signature extension.';
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: simulatedSpoken,
      timestamp: now,
      source: 'app',
      attachment: {
        type: 'voice',
        name: `Voice Directive (0:${recordingSeconds.toString().padStart(2, '0')})`,
        url: audioUrl,
      },
    };

    setMessages((prev) => [...prev, userMsg]);
    dispatchToWhatsAppMirror(simulatedSpoken, 'user');

    try {
      const parsed = await geminiStaff.parseDirective(simulatedSpoken, 'voice');
      onSpawnCard(parsed.card);
      soundManager.playApproveChime();

      const staffReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'staff',
        text: `Synthesized your voice directive into an Action Card: "${parsed.card.headline}". It is queued in your Cockpit for one-tap execution.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'app',
        spawnedCard: parsed.card,
      };

      setMessages((prev) => [...prev, staffReply]);
      dispatchToWhatsAppMirror(staffReply.text, 'staff');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // SEND TEXT MESSAGE
  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText.trim();
    setInputText('');
    soundManager.playTap();

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: now,
      source: 'app',
    };

    setMessages((prev) => [...prev, userMsg]);
    dispatchToWhatsAppMirror(textToSend, 'user');
    setIsProcessing(true);

    try {
      const parsed = await geminiStaff.parseDirective(textToSend, 'chat');
      onSpawnCard(parsed.card);
      soundManager.playApproveChime();

      const staffReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'staff',
        text: `Directive processed: "${parsed.card.headline}". Action card prepared in Cockpit.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'app',
        spawnedCard: parsed.card,
      };

      setMessages((prev) => [...prev, staffReply]);
      dispatchToWhatsAppMirror(staffReply.text, 'staff');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // FILE & CAMERA HANDLING
  const handleFileUpload = async (file: File, isCamera = false) => {
    soundManager.playTap();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: isCamera ? 'Captured photo of document/receipt.' : `Attached file: ${file.name}`,
      timestamp: now,
      source: 'app',
      attachment: {
        type: isCamera ? 'image' : 'file',
        name: file.name,
      },
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      const parsed = await geminiStaff.parseDirective(`Process attached file: ${file.name}`, 'document');
      onSpawnCard(parsed.card);
      soundManager.playApproveChime();

      const staffReply: ChatMessage = {
        id: `msg-reply-${Date.now()}`,
        sender: 'staff',
        text: `Extracted data from ${file.name}. Action card generated with itemized preview in your Cockpit.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'app',
        spawnedCard: parsed.card,
      };

      setMessages((prev) => [...prev, staffReply]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const whatsappDirectUrl = `https://wa.me/?text=${encodeURIComponent('START LIFEOS CHIEF OF STAFF: Live session sync.')}`;

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden max-w-2xl mx-auto relative select-none">
      {/* WhatsApp Live Status Bar if paired */}
      {isWhatsAppConnected && (
        <div className="shrink-0 px-3 py-1.5 bg-emerald-950/40 border-b border-emerald-500/20 flex items-center justify-between text-[11px] backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WhatsApp Live Sync Active</span>
            {whatsAppNumber && <span className="font-mono text-slate-400 font-normal">({whatsAppNumber})</span>}
          </div>
          <a
            href={whatsappDirectUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold transition"
          >
            <span>Open WhatsApp</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* 1. SCROLLABLE MESSAGES STREAM */}
      <div className="flex-1 overflow-y-auto space-y-3 p-3 sm:p-4 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'staff' && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm text-xs font-black">
                ⚡
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-3xl p-3.5 text-xs shadow-md leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-sm'
              }`}
            >
              {/* WhatsApp Source Badge */}
              {msg.source === 'whatsapp' && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 mb-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>via WhatsApp</span>
                </div>
              )}

              <div>{msg.text}</div>

              {/* Voice Player Attachment */}
              {msg.attachment?.type === 'voice' && msg.attachment.url && (
                <div className="mt-2">
                  <audio src={msg.attachment.url} controls className="h-7 w-full max-w-[200px]" />
                </div>
              )}

              {/* File / Camera Attachment badge */}
              {msg.attachment && msg.attachment.type !== 'voice' && (
                <div className="mt-2 flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-xl text-[10px] text-slate-300">
                  <FileText className="w-3 h-3 text-indigo-400" />
                  <span>{msg.attachment.name}</span>
                </div>
              )}

              {/* 1-Tap Action Card Link */}
              {msg.spawnedCard && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-emerald-400">
                    Card queued in Cockpit
                  </span>
                  <button
                    onClick={onNavigateToApprovals}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition shrink-0"
                  >
                    <span>View Card</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div
                className={`text-[9px] mt-1 text-right ${
                  msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 p-2 rounded-2xl bg-slate-900/60 border border-slate-800 w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Chief of Staff synthesizing directive...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 2. INPUT BAR (LOCKED IN BOTTOM JUST ABOVE FOOTER) */}
      <div className="shrink-0 p-2 sm:p-3 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl">
        {/* Hidden inputs for Camera and File attachment */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0], true);
            }
          }}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0], false);
            }
          }}
          className="hidden"
        />

        <div className="flex items-center gap-2">
          {/* Main Input Capsule with embedded camera and attach buttons */}
          <div className="flex-1 flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5 shadow-inner focus-within:border-indigo-500 transition">
            {/* Embedded Camera Button */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
              title="Snap photo of receipt or bill"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Embedded Attach Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
              title="Attach document or PDF"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Type Bar */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendText();
              }}
              placeholder="Message your Chief of Staff..."
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none py-1 min-w-0"
            />

            {/* Send icon if text present */}
            {inputText.trim() && (
              <button
                onClick={handleSendText}
                className="p-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Big Mic Button on Right */}
          {isRecording ? (
            <button
              onClick={handleStopRecordingAndSend}
              className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-600/40 ring-4 ring-rose-500/20 animate-pulse transition"
              title="Stop and delegate voice directive"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              onClick={handleStartRecording}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/20 active:scale-95 transition"
              title="Record voice directive"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
