import { useState, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export type UpdaterStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'up-to-date' | 'error';

export function useUpdater() {
  const [status, setStatus] = useState<UpdaterStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const checkForUpdates = useCallback(async (_manual = false) => {
    try {
      setStatus('checking');
      setError(null);
      const update = await check();
      
      if (update) {
        setUpdateInfo(update);
        setStatus('available');
        return update;
      } else {
        setStatus('up-to-date');
        setUpdateInfo(null);
        return null;
      }
    } catch (err: any) {
      console.error('Failed to check for updates:', err);
      setStatus('error');
      setError(err?.message || 'Gagal memeriksa pembaruan');
      return null;
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    if (!updateInfo) return;

    try {
      setStatus('downloading');
      setProgress(0);
      setError(null);
      
      let downloadedBytes = 0;
      await updateInfo.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            setProgress(0);
            break;
          case 'Progress':
            downloadedBytes += event.data.chunkLength;
            const totalBytes = (event.data as { contentLength?: number }).contentLength;
            if (totalBytes) {
              const percent = (downloadedBytes / totalBytes) * 100;
              setProgress(Math.min(percent, 100));
            }
            break;
          case 'Finished':
            setProgress(100);
            break;
        }
      });
      
      setStatus('ready');
      // Automatically relaunch after successful installation
      await relaunch();
    } catch (err: any) {
      console.error('Failed to download and install update:', err);
      setStatus('error');
      setError(err?.message || 'Gagal mengunduh dan memasang pembaruan');
    }
  }, [updateInfo]);

  const dismiss = useCallback(() => {
    setStatus('idle');
    setUpdateInfo(null);
    setProgress(0);
    setError(null);
  }, []);

  // Check if update is mandatory based on a custom property or parsing the release notes.
  // Assuming the latest.json will have `"mandatory": true` injected into the notes if it doesn't support custom fields.
  // Alternatively, if the Tauri updater object exposes custom fields we'd check there.
  // Let's parse the body (release notes) for a keyword "[MANDATORY]" or check if update body contains it.
  const isMandatory = updateInfo?.body?.includes('[MANDATORY]') || false;

  return {
    status,
    updateInfo,
    progress,
    error,
    isMandatory,
    checkForUpdates,
    downloadAndInstall,
    dismiss
  };
}
