'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Send,
  Sparkles,
  Key,
  MessageSquare,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { UserIntegrationsConfig, storage } from '@/lib/storage';
import { soundManager } from '@/lib/audio';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: UserIntegrationsConfig;
  onUpdateConfig: (updated: UserIntegrationsConfig) => void;
}

export const IntegrationsModal: React.FC<IntegrationsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'google' | 'whatsapp' | 'gemini'>('google');

  // WhatsApp form state
  const [whatsappPhoneId, setWhatsappPhoneId] = useState(config.whatsappPhoneNumberId || '');
  const [whatsappToken, setWhatsappToken] = useState(config.whatsappAccessToken || '');
  const [whatsappRecipient, setWhatsappRecipient] = useState(config.whatsappRecipientPhone || '');
  const [whatsappTesting, setWhatsappTesting] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Gemini form state
  const [geminiKey, setGeminiKey] = useState(config.geminiApiKey || '');
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Copy helper
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  if (!isOpen) return null;

  const handleSaveWhatsApp = () => {
    soundManager.playTap();
    const updated = {
      ...config,
      whatsappPhoneNumberId: whatsappPhoneId.trim(),
      whatsappAccessToken: whatsappToken.trim(),
      whatsappRecipientPhone: whatsappRecipient.trim(),
    };
    storage.setConfig(updated);
    onUpdateConfig(updated);
  };

  const handleTestWhatsApp = async () => {
    handleSaveWhatsApp();
    setWhatsappTesting(true);
    setWhatsappStatus(null);
    soundManager.playTap();

    try {
      const res = await fetch('/api/integrations/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: whatsappPhoneId.trim(),
          accessToken: whatsappToken.trim(),
          recipientPhone: whatsappRecipient.trim(),
          messageText: '⚡ LifeOS: WhatsApp Business Integration verified successfully.',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setWhatsappStatus({ success: true, msg: `Sent! Message ID: ${data.messageId}` });
        soundManager.playApproveChime();
      } else {
        setWhatsappStatus({ success: false, msg: data.error || 'WhatsApp message dispatch failed' });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      setWhatsappStatus({ success: false, msg });
    } finally {
      setWhatsappTesting(false);
    }
  };

  const handleSaveGemini = () => {
    soundManager.playTap();
    const updated = {
      ...config,
      geminiApiKey: geminiKey.trim(),
    };
    storage.setConfig(updated);
    onUpdateConfig(updated);
  };

  const handleTestGemini = async () => {
    handleSaveGemini();
    setGeminiTesting(true);
    setGeminiStatus(null);
    soundManager.playTap();

    try {
      const res = await fetch('/api/integrations/gemini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiKey.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeminiStatus({
          success: true,
          msg: `Connected to ${data.model} in ${data.latencyMs}ms. Status: ${data.response}`,
        });
        soundManager.playApproveChime();
      } else {
        setGeminiStatus({ success: false, msg: data.error || 'Failed to authenticate with Gemini' });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to reach API';
      setGeminiStatus({ success: false, msg });
    } finally {
      setGeminiTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/whatsapp`
      : 'https://lessgo-eta.vercel.app/api/webhooks/whatsapp';
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">Connected Accounts</h2>
            <p className="text-xs text-slate-400">Connect Google OAuth, WhatsApp API & Gemini</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-2xl mb-5 border border-slate-800">
          <button
            onClick={() => setActiveTab('google')}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'google'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google OAuth
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            WhatsApp API
          </button>
          <button
            onClick={() => setActiveTab('gemini')}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'gemini'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gemini Key
          </button>
        </div>

        {/* TAB 1: GOOGLE OAUTH */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center font-black">
                  G
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Google Workspace</div>
                  <div className="text-[11px] text-slate-400">
                    {config.googleConnected
                      ? `Connected: ${config.googleEmail || 'Active'}`
                      : 'Tasks, Calendar & Gmail'}
                  </div>
                </div>
              </div>

              {config.googleConnected ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Linked
                  </span>
                  <button
                    onClick={() => {
                      const updated = { ...config, googleConnected: false, googleAccessToken: '', googleEmail: '' };
                      storage.setConfig(updated);
                      onUpdateConfig(updated);
                    }}
                    className="text-[11px] text-slate-500 hover:text-rose-400"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <a
                  href="/api/auth/google"
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <span>Connect Google</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300">Included Google Permissions:</div>
              <div>• Google Tasks: Sync routines and keystone habits.</div>
              <div>• Google Calendar: Read UP NEXT events and schedule focus blocks.</div>
              <div>• Gmail API: Send or draft approved counter-offers and replies.</div>
            </div>
          </div>
        )}

        {/* TAB 2: WHATSAPP CLOUD API */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Meta Phone Number ID
              </label>
              <input
                type="text"
                value={whatsappPhoneId}
                onChange={(e) => setWhatsappPhoneId(e.target.value)}
                placeholder="e.g. 104829105829102"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Meta WhatsApp Access Token
              </label>
              <input
                type="password"
                value={whatsappToken}
                onChange={(e) => setWhatsappToken(e.target.value)}
                placeholder="EAAGm0PX4ZC..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Your Phone Number for Test Ping
              </label>
              <input
                type="text"
                value={whatsappRecipient}
                onChange={(e) => setWhatsappRecipient(e.target.value)}
                placeholder="+14155552671"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Webhook Callback URL:</span>
                <button
                  onClick={copyWebhookUrl}
                  className="flex items-center gap-1 text-emerald-400 font-semibold hover:text-emerald-300"
                >
                  {copiedWebhook ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-[10px] font-mono text-slate-300 truncate">
                https://lessgo-eta.vercel.app/api/webhooks/whatsapp
              </div>
              <div className="text-[10px] text-slate-400">
                Verify Token: <code className="text-emerald-300">lifeos_chief_of_staff_secure_token</code>
              </div>
            </div>

            {whatsappStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs font-medium ${
                  whatsappStatus.success
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                }`}
              >
                {whatsappStatus.msg}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleSaveWhatsApp}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
              >
                Save WhatsApp Credentials
              </button>

              <button
                onClick={handleTestWhatsApp}
                disabled={whatsappTesting || !whatsappPhoneId || !whatsappToken || !whatsappRecipient}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-40"
              >
                {whatsappTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send WhatsApp Test Ping</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: GEMINI KEY */}
        {activeTab === 'gemini' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Google AI Studio API Key</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            {geminiStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs font-medium ${
                  geminiStatus.success
                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                }`}
              >
                {geminiStatus.msg}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleSaveGemini}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
              >
                Save Gemini Key
              </button>

              <button
                onClick={handleTestGemini}
                disabled={geminiTesting || !geminiKey}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition disabled:opacity-40"
              >
                {geminiTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Verify & Test Key</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
