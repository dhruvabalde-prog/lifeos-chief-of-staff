'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from '@/components/TopBar';
import { EmergencyBanner } from '@/components/EmergencyBanner';
import { ApprovalsViewportDeck } from '@/components/ApprovalsViewportDeck';
import { ChatboxHomepage } from '@/components/ChatboxHomepage';
import { OperationsView } from '@/components/OperationsView';
import { RoutinePlayerModal } from '@/components/RoutinePlayerModal';
import { ConnectModal } from '@/components/ConnectModal';
import { LedgerModal } from '@/components/LedgerModal';
import { MobileNavBar, MainViewTab } from '@/components/MobileNavBar';
import { ActionCard, Routine, RoutineStep, ActivityLedgerEntry, CalendarEvent, NorthStarItem, Mission } from '@/types/lifeos';
import { storage, UserIntegrationsConfig } from '@/lib/storage';

export default function LifeOSApp() {
  // Centre page is homepage, a chatbox
  const [currentView, setCurrentView] = useState<MainViewTab>('chat');
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);

  // Real Persistent States (Zero mock placeholders)
  const [cards, setCards] = useState<ActionCard[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activityLedger, setActivityLedger] = useState<ActivityLedgerEntry[]>([]);
  const [config, setConfig] = useState<UserIntegrationsConfig>({
    googleConnected: false,
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    whatsappRecipientPhone: '',
    geminiApiKey: '',
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [northStars] = useState<NorthStarItem[]>([]);
  const [missions] = useState<Mission[]>([]);

  // Modals
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load from Storage
  useEffect(() => {
    setCards(storage.getCards());
    setRoutines(storage.getRoutines());
    setActivityLedger(storage.getLedger());
    setEmergencyMode(storage.getEmergency());
    setConfig(storage.getConfig());
  }, []);

  // Fetch real Google Tasks, Calendar & Gmail
  const fetchWorkspaceData = useCallback(async (token?: string) => {
    const activeToken = token || storage.getConfig().googleAccessToken || config.googleAccessToken;
    if (!activeToken) return;

    try {
      const res = await fetch('/api/integrations/google/sync', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.data) {
          // 1. Calendar
          if (payload.data.calendarEvents && payload.data.calendarEvents.length > 0) {
            setCalendarEvents(payload.data.calendarEvents);
          }

          // 2. Tasks
          if (payload.data.tasks && payload.data.tasks.length > 0) {
            const newCardsFromTasks: ActionCard[] = payload.data.tasks.map((t: any) => ({
              id: t.id,
              category: 'lifeops' as const,
              categoryLabel: '✅ GOOGLE TASK',
              sourceContext: 'Live sync from Google Tasks',
              headline: t.title,
              synthesis: t.notes || 'Delegated task retrieved from your primary Google Task list.',
              urgency: 'high' as const,
              isKeystone: false,
              status: 'pending' as const,
              createdAt: new Date().toISOString(),
              targetArtifact: 'Google Tasks (@default)',
              googleService: 'Google Tasks' as const,
              previewType: 'checklist' as const,
              previewData: { docTitle: t.title },
            }));

            setCards((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const unique = newCardsFromTasks.filter((c) => !existingIds.has(c.id));
              const merged = [...unique, ...prev];
              storage.setCards(merged);
              return merged;
            });
          }

          // 3. Gmail
          if (payload.data.emails && payload.data.emails.length > 0) {
            const emailCards: ActionCard[] = payload.data.emails.map((m: any) => ({
              id: `gmail-${m.id}`,
              category: 'responses' as const,
              categoryLabel: '📧 GMAIL PRIORITY',
              sourceContext: `From: ${m.from}`,
              headline: `Respond to: "${m.subject}"`,
              synthesis: m.snippet || 'Unread email requiring executive directive.',
              urgency: 'high' as const,
              isKeystone: false,
              status: 'pending' as const,
              createdAt: new Date().toISOString(),
              targetArtifact: 'Gmail (users/me)',
              googleService: 'Google Docs' as const,
              previewType: 'email' as const,
              previewData: {
                subject: `Re: ${m.subject}`,
                to: m.from,
                body: `Hello,\n\nI have reviewed your message regarding "${m.subject}". We are proceeding accordingly.\n\nBest regards,\nChief Executive Office`,
              },
            }));

            setCards((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const unique = emailCards.filter((c) => !existingIds.has(c.id));
              const merged = [...unique, ...prev];
              storage.setCards(merged);
              return merged;
            });
          }

          showToast('🔄 Google Workspace: Tasks, Calendar & Mail Synced');
        }
      }
    } catch (err) {
      console.warn('Workspace sync failed', err);
    }
  }, [config.googleAccessToken]);

  // Capture Google OAuth Redirect Callback from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const googleConnected = params.get('google_connected');
      const googleEmail = params.get('google_email');
      const accessToken = params.get('access_token');
      const googleError = params.get('google_error');

      if (googleError) {
        showToast(`⚠️ Google Auth Error: ${decodeURIComponent(googleError)}`);
        window.history.replaceState({}, '', window.location.pathname);
      } else if (googleConnected === 'true' && accessToken) {
        const updatedConfig = {
          ...storage.getConfig(),
          googleConnected: true,
          googleEmail: googleEmail || 'executive@gmail.com',
          googleAccessToken: accessToken,
        };
        setConfig(updatedConfig);
        storage.setConfig(updatedConfig);
        fetchWorkspaceData(accessToken);
        window.history.replaceState({}, '', window.location.pathname);
        showToast(`🟢 Google Workspace Connected: ${googleEmail || 'Active'}`);
      }
    }
  }, [fetchWorkspaceData]);

  // Simulate Inbound WhatsApp Directive for instant live testing
  const handleSimulateWhatsAppInbound = async () => {
    try {
      const simulatedText = 'Ramesh cook took ₹2,000 cash advance today and Kamla maid is on leave.';
      const res = await fetch('/api/integrations/whatsapp/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: simulatedText,
          sender: 'user',
          source: 'whatsapp',
          senderPhone: config.whatsappRecipientPhone || '+1 (555) 019-2831',
        }),
      });

      if (res.ok) {
        showToast('📲 WhatsApp Inbound Received: Mirrored in Chatbox');
      }
    } catch {
      // Non-blocking
    }
  };

  // Sync mutations
  const updateCards = (newCards: ActionCard[]) => {
    setCards(newCards);
    storage.setCards(newCards);
  };

  const updateRoutines = (newRoutines: Routine[]) => {
    setRoutines(newRoutines);
    storage.setRoutines(newRoutines);
  };

  const updateLedger = (newLedger: ActivityLedgerEntry[]) => {
    setActivityLedger(newLedger);
    storage.setLedger(newLedger);
  };

  // Toggle Emergency / Sick Mode
  const handleToggleEmergency = () => {
    const next = !emergencyMode;
    setEmergencyMode(next);
    storage.setEmergency(next);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: next ? 'SICK_SHIELD_ACTIVATED' : 'SICK_SHIELD_DEACTIVATED',
      cardTitle: next ? 'Emergency Sick Shield Active' : 'Shield Stood Down',
      categoryLabel: '🛡️ PROTOCOL',
      details: next
        ? 'Quarantined non-essential tasks. Streaks frozen with SICK_DAY_PAUSE.'
        : 'Restored all quarantined tasks to deck with zero data loss.',
      actor: 'User (Principal)',
      streakStatus: next ? 'SICK_DAY_PAUSE' : 'COMPLETED',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast(next ? '🚨 Emergency Shield Active' : 'Shield Deactivated');
  };

  // 1. APPROVE & EXECUTE
  const handleApproveCard = async (card: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = cards.map((c) => (c.id === card.id ? { ...c, status: 'approved' as const } : c));
    updateCards(updated);

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'EXECUTE',
      cardTitle: card.headline,
      categoryLabel: card.categoryLabel,
      details: `Executed by Chief of Staff. Target: ${card.targetEntity || card.targetArtifact || 'System'}.`,
      actor: 'Executive Chief of Staff',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast(`🚀 Dispatched: "${card.headline.slice(0, 32)}..."`);
  };

  // 2. SNOOZE / DEFER
  const handleSnoozeCard = (card: ActionCard, deferLabel: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = cards.map((c) => (c.id === card.id ? { ...c, status: 'snoozed' as const, wakeAt: deferLabel } : c));
    updateCards(updated);

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'SNOOZE',
      cardTitle: card.headline,
      categoryLabel: card.categoryLabel,
      details: `Deferred to: ${deferLabel}.`,
      actor: 'User (Principal)',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast(`🕒 Snoozed: ${deferLabel}`);
  };

  // 3. QUICK CRITIQUE RE-DRAFT
  const handleCritiqueUpdate = (updatedCard: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = cards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
    updateCards(updated);

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'CRITIQUE_REDRAFT',
      cardTitle: updatedCard.headline,
      categoryLabel: updatedCard.categoryLabel,
      details: `Re-drafted in place based on voice critique.`,
      actor: 'User (Principal)',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast('✨ Critique applied: Card re-drafted in place.');
  };

  // 4. SAVE TO DRAFTS
  const handleSaveToDrafts = (card: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = cards.map((c) => (c.id === card.id ? { ...c, status: 'drafted' as const } : c));
    updateCards(updated);

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'DRAFT_SAVED',
      cardTitle: card.headline,
      categoryLabel: card.categoryLabel,
      details: `Saved to native drafts.`,
      actor: 'User (Principal)',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast('📥 Saved to Drafts.');
  };

  // 5. KILL MISSION
  const handleKillMission = (card: ActionCard) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updated = cards.map((c) => (c.id === card.id ? { ...c, status: 'killed' as const } : c));
    updateCards(updated);

    const logEntry: ActivityLedgerEntry = {
      id: `act-${Date.now()}`,
      timestamp: now,
      actionType: 'KILLED',
      cardTitle: card.headline,
      categoryLabel: card.categoryLabel,
      details: `Rejected permanently.`,
      actor: 'User (Principal)',
    };

    updateLedger([logEntry, ...activityLedger]);
    showToast('🗑️ Card Killed.');
  };

  // Routine Step Update
  const handleUpdateRoutineSteps = (routineId: string, steps: RoutineStep[]) => {
    const updated = routines.map((r) => (r.id === routineId ? { ...r, steps } : r));
    updateRoutines(updated);
  };

  // Spawn Card from Chatbox, Voice Directive, or Protocols
  const handleSpawnCard = (newCard: ActionCard) => {
    const updated = [newCard, ...cards];
    updateCards(updated);
    showToast(`🎯 Formulated Cockpit Card: "${newCard.headline.slice(0, 24)}..."`);
  };

  const pendingCards = cards.filter((c) => c.status === 'pending');
  const quarantinedCount = pendingCards.filter((c) => !c.isKeystone).length;
  const keystoneCount = pendingCards.filter((c) => c.isKeystone).length;
  const visibleCardCount = emergencyMode ? keystoneCount : pendingCards.length;

  return (
    <div className="h-dvh flex flex-col bg-[#090d16] text-slate-100 selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* 1. TOP BAR HEADER (Shield Icon Only + Settings Dropdown) */}
      <div className="shrink-0">
        <TopBar
          emergencyMode={emergencyMode}
          onToggleEmergency={handleToggleEmergency}
          onOpenLedger={() => setIsLedgerOpen(true)}
          onOpenConnect={() => setIsConnectOpen(true)}
          isWhatsAppConnected={Boolean(config.whatsappRecipientPhone)}
          isGoogleConnected={Boolean(config.googleConnected)}
        />

        {/* Emergency / Sick Shield Warning */}
        <EmergencyBanner
          active={emergencyMode}
          onStandDown={handleToggleEmergency}
          quarantinedCount={quarantinedCount}
          keystoneCount={keystoneCount}
        />
      </div>

      {/* 2. MAIN VIEW AREA (Fills exact viewport space above footer) */}
      <main className="flex-1 min-h-0 overflow-hidden px-3 sm:px-4 pt-2 pb-16">
        {/* VIEW 1: APPROVALS (Single card fits full viewport, zero scroll, auto swipe up) */}
        {currentView === 'approvals' && (
          <div className="h-full w-full animate-fade-in">
            <ApprovalsViewportDeck
              cards={cards}
              emergencyMode={emergencyMode}
              onApprove={handleApproveCard}
              onSnooze={handleSnoozeCard}
              onCritiqueUpdate={handleCritiqueUpdate}
              onSaveToDrafts={handleSaveToDrafts}
              onKillMission={handleKillMission}
            />
          </div>
        )}

        {/* VIEW 2: STAFF / CHATBOX (Centre page is homepage, input bar locked above footer, WhatsApp mirror) */}
        {currentView === 'chat' && (
          <div className="h-full w-full animate-fade-in">
            <ChatboxHomepage
              onSpawnCard={handleSpawnCard}
              onNavigateToApprovals={() => setCurrentView('approvals')}
              isWhatsAppConnected={Boolean(config.whatsappRecipientPhone)}
              whatsAppNumber={config.whatsappRecipientPhone}
            />
          </div>
        )}

        {/* VIEW 3: OPERATIONS (Tasks, Routines, Calendar, North Stars, Goals, Protocols with top scrollable pill filters) */}
        {currentView === 'operations' && (
          <div className="h-full w-full animate-fade-in">
            <OperationsView
              routines={routines}
              calendarEvents={calendarEvents}
              northStars={northStars}
              missions={missions}
              cards={cards}
              emergencyMode={emergencyMode}
              onOpenRoutine={(routine) => setSelectedRoutine(routine)}
              onApproveCard={handleApproveCard}
              onSpawnCard={handleSpawnCard}
              onNavigateToApprovals={() => setCurrentView('approvals')}
            />
          </div>
        )}
      </main>

      {/* 3. STICKY BOTTOM NAVIGATION (3 Tabs: Approvals, Staff/Home, Operations) */}
      <MobileNavBar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        pendingCount={visibleCardCount}
      />

      {/* Routine Player Modal */}
      <RoutinePlayerModal
        routine={selectedRoutine}
        isOpen={Boolean(selectedRoutine)}
        emergencyMode={emergencyMode}
        onClose={() => setSelectedRoutine(null)}
        onUpdateRoutineSteps={handleUpdateRoutineSteps}
      />

      {/* Connect Modal (WhatsApp Number & Google Login, Zero API keys) */}
      <ConnectModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        config={config}
        onUpdateConfig={(cfg) => setConfig(cfg)}
        onShowToast={showToast}
        onSyncGoogle={() => fetchWorkspaceData()}
        onSimulateWhatsAppInbound={handleSimulateWhatsAppInbound}
      />

      {/* Ledger Modal (Accessed from Top Right Settings Dropdown) */}
      <LedgerModal
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        entries={activityLedger}
        emergencyMode={emergencyMode}
      />

      {/* Floating Action Toast */}
      {toastMessage && (
        <aside aria-label="Notification" className="fixed bottom-20 md:bottom-16 right-4 md:right-6 z-50 px-3.5 py-2.5 rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-2xl text-xs font-semibold text-white flex items-center gap-2 backdrop-blur-md animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </aside>
      )}
    </div>
  );
}
