'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, BatteryLow, CheckCircle2, XCircle, AlertCircle, Zap } from 'lucide-react';
import {
  getNotificationSettings,
  saveNotificationSettings,
  getPermission,
  requestPermission,
  sendNotification,
  type NotificationSettings,
  type PermissionState,
} from '@/lib/notifications';
import { useLang } from '@/lib/i18n';

// ── Helpers ──────────────────────────────────────────────────────────────────

function batteryColor(value: number) {
  if (value >= 70) return '#4ade80';
  if (value >= 40) return '#facc15';
  return '#f87171';
}

// ── Component ────────────────────────────────────────────────────────────────

export default function NotificationSettings() {
  const { t } = useLang();
  const [settings,    setSettings]    = useState<NotificationSettings>({ enabled: false, threshold: 30 });
  const [permission,  setPermission]  = useState<PermissionState>('default');
  const [testStatus,  setTestStatus]  = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [requesting,  setRequesting]  = useState(false);
  const [mounted,     setMounted]     = useState(false);

  // Load saved settings (client-only)
  useEffect(() => {
    setSettings(getNotificationSettings());
    setPermission(getPermission());
    setMounted(true);
  }, []);

  // Persist whenever settings change
  const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveNotificationSettings(next);
      return next;
    });
  }, []);

  const handleToggle = async () => {
    const willEnable = !settings.enabled;

    if (willEnable && permission !== 'granted') {
      setRequesting(true);
      const result = await requestPermission();
      setPermission(result);
      setRequesting(false);
      if (result !== 'granted') return; // user denied — don't enable
    }

    updateSettings({ enabled: willEnable });
  };

  const handleThreshold = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ threshold: parseInt(e.target.value, 10) });
  };

  const handleRequestPermission = async () => {
    setRequesting(true);
    const result = await requestPermission();
    setPermission(result);
    setRequesting(false);
  };

  const handleTest = async () => {
    setTestStatus('sending');
    const ok = await sendNotification(
      t('notifications.testTitle'),
      t('notifications.testBody', { threshold: settings.threshold }),
      'garmin-test',
    );
    setTestStatus(ok ? 'sent' : 'failed');
    setTimeout(() => setTestStatus('idle'), 3000);
  };

  // Don't render until hydrated (avoids localStorage mismatch)
  if (!mounted) return null;

  const isUnsupported = permission === 'unsupported';
  const isDenied      = permission === 'denied';
  const isGranted     = permission === 'granted';
  const thresholdColor = batteryColor(settings.threshold);

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header mb-4">
        <Bell size={14} className="text-battery" />
        <span>{t('notifications.title')}</span>
        {settings.enabled && isGranted && (
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
            {t('notifications.active')}
          </span>
        )}
      </div>

      {/* Unsupported browser */}
      {isUnsupported && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-bg border border-border mb-4">
          <AlertCircle size={14} className="text-muted mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted">
            {t('notifications.noSupport')}
          </p>
        </div>
      )}

      {/* Permission denied */}
      {isDenied && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-400/5 border border-red-400/20 mb-4">
          <XCircle size={14} className="text-recovery-red mt-0.5 flex-shrink-0" />
          <p className="text-xs text-secondary">
            {t('notifications.denied')}
          </p>
        </div>
      )}

      {/* Permission request (default state) */}
      {!isUnsupported && !isDenied && !isGranted && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-battery/5 border border-battery/20 mb-4">
          <BatteryLow size={14} className="text-battery flex-shrink-0" />
          <p className="text-xs text-secondary flex-1">
            {t('notifications.needPermission')}
          </p>
          <button
            onClick={handleRequestPermission}
            disabled={requesting}
            className="text-xs font-semibold text-battery px-3 py-1.5 rounded-lg bg-battery/10 hover:bg-battery/20 transition-colors disabled:opacity-50"
          >
            {requesting ? t('notifications.requesting') : t('notifications.allow')}
          </button>
        </div>
      )}

      {/* Permission granted indicator */}
      {isGranted && (
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={13} className="text-recovery-green" />
          <span className="text-[11px] text-secondary">{t('notifications.granted')}</span>
        </div>
      )}

      {/* Main toggle */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-primary">{t('notifications.enable')}</p>
          <p className="text-[10px] text-muted mt-0.5">
            {t('notifications.alertDesc')}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={isUnsupported || isDenied || requesting}
          className={[
            'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            settings.enabled && isGranted ? 'bg-battery' : 'bg-border',
          ].join(' ')}
          aria-label="Toggle notifications"
        >
          <span
            className={[
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
              settings.enabled && isGranted ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Threshold slider — only when enabled and granted */}
      {settings.enabled && isGranted && (
        <>
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-primary">{t('notifications.thresholdLabel')}</p>
              <div className="flex items-center gap-1">
                <Zap size={11} style={{ color: thresholdColor }} />
                <span
                  className="text-sm font-black leading-none"
                  style={{ color: thresholdColor }}
                >
                  {settings.threshold}%
                </span>
              </div>
            </div>
            <p className="text-[10px] text-muted mb-3">
              {t('notifications.thresholdNote')}
            </p>

            {/* Visual bar showing threshold on battery scale */}
            <div className="relative mb-3">
              <div className="h-2 rounded-full bg-gradient-to-r from-recovery-red via-yellow-400 to-recovery-green" />
              {/* Threshold marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-bg shadow transition-all"
                style={{
                  left: `${settings.threshold}%`,
                  transform: 'translateX(-50%) translateY(-50%)',
                  backgroundColor: thresholdColor,
                  boxShadow: `0 0 6px ${thresholdColor}88`,
                }}
              />
            </div>

            <input
              type="range"
              min={10}
              max={60}
              step={5}
              value={settings.threshold}
              onChange={handleThreshold}
              className="w-full h-1 rounded-full appearance-none cursor-pointer accent-battery bg-transparent"
            />
            <div className="flex justify-between text-[9px] text-muted mt-1">
              <span>10%</span>
              <span>20%</span>
              <span>30%</span>
              <span>40%</span>
              <span>50%</span>
              <span>60%</span>
            </div>
          </div>

          {/* Hint by level */}
          <div className="text-[10px] text-muted mt-1 mb-4 flex items-center gap-1">
            {settings.threshold <= 20 && (
              <><AlertCircle size={10} className="text-recovery-red" /> {t('notifications.thresholdHints.low')}</>
            )}
            {settings.threshold > 20 && settings.threshold <= 35 && (
              <><CheckCircle2 size={10} className="text-recovery-green" /> {t('notifications.thresholdHints.mid')}</>
            )}
            {settings.threshold > 35 && (
              <><Bell size={10} className="text-yellow-400" /> {t('notifications.thresholdHints.high')}</>
            )}
          </div>

          {/* Test button */}
          <button
            onClick={handleTest}
            disabled={testStatus === 'sending'}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-bg border border-border text-xs text-secondary hover:text-primary hover:border-battery/30 transition-colors disabled:opacity-50"
          >
            {testStatus === 'idle'    && <><Bell size={12} /> {t('notifications.testBtn')}</>}
            {testStatus === 'sending' && <><span className="animate-pulse">…</span> {t('notifications.sending')}</>}
            {testStatus === 'sent'    && <><CheckCircle2 size={12} className="text-recovery-green" /> {t('notifications.sent')}</>}
            {testStatus === 'failed'  && <><XCircle size={12} className="text-recovery-red" /> {t('notifications.error')}</>}
          </button>
        </>
      )}

      {/* Cooldown note */}
      {settings.enabled && isGranted && (
        <p className="text-[9px] text-muted mt-3 text-center">
          {t('notifications.rateLimitNote')}
        </p>
      )}

      {/* Disabled state help */}
      {!settings.enabled && isGranted && (
        <div className="flex items-center gap-2 mt-1">
          <BellOff size={12} className="text-muted" />
          <p className="text-[10px] text-muted">
            {t('notifications.inactiveNote')}
          </p>
        </div>
      )}
    </div>
  );
}
