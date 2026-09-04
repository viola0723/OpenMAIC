'use client';

import { useCallback, useRef, useState } from 'react';
import { SettingsCodeModal } from '@/components/settings-code-modal';

type GateState = 'unknown' | 'open' | 'locked' | 'unlocked';

/**
 * Gates opening the settings dialog behind SETTINGS_CODE. `requestOpen(fn)`
 * runs `fn` immediately when no code is configured or a valid cookie already
 * exists; otherwise it shows the code modal first and runs `fn` on success.
 */
export function useSettingsGate() {
  const [state, setState] = useState<GateState>('unknown');
  const [modalOpen, setModalOpen] = useState(false);
  const pendingRef = useRef<(() => void) | null>(null);

  const requestOpen = useCallback(
    (openSettings: () => void) => {
      if (state === 'open' || state === 'unlocked') {
        openSettings();
        return;
      }
      void (async () => {
        try {
          const res = await fetch('/api/settings-code/status');
          const data = await res.json();
          if (!data.enabled) {
            setState('open');
            openSettings();
            return;
          }
          if (data.authenticated) {
            setState('unlocked');
            openSettings();
            return;
          }
        } catch {
          // Fail closed, same as the site-wide gate: ask for the code.
        }
        setState('locked');
        pendingRef.current = openSettings;
        setModalOpen(true);
      })();
    },
    [state],
  );

  const modal = (
    <SettingsCodeModal
      open={modalOpen}
      onSuccess={() => {
        setState('unlocked');
        setModalOpen(false);
        const pending = pendingRef.current;
        pendingRef.current = null;
        pending?.();
      }}
      onCancel={() => {
        setModalOpen(false);
        pendingRef.current = null;
      }}
    />
  );

  return { requestOpen, modal };
}
