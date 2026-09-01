import { useEffect } from 'react';
import { useUpdater } from '@/shared/hooks/useUpdater';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Download, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';

export function UpdateModal() {
  const {
    status,
    updateInfo,
    progress,
    error,
    isMandatory,
    checkForUpdates,
    downloadAndInstall,
    dismiss
  } = useUpdater();

  // Check for updates on mount
  useEffect(() => {
    checkForUpdates();

    const handleManualCheck = () => {
      checkForUpdates(true);
    };

    window.addEventListener('arxiva-check-updates', handleManualCheck);
    return () => {
      window.removeEventListener('arxiva-check-updates', handleManualCheck);
    };
  }, [checkForUpdates]);

  // If there's no update available and not downloading, don't show the modal
  // (We show it if status is 'available', 'downloading', 'ready', or 'error' if it's mandatory maybe, but let's just show on these states)
  const isVisible = ['available', 'downloading', 'ready', 'error'].includes(status) && updateInfo !== null;

  if (!isVisible && !error) return null;

  // Render progress bar fallback if component doesn't exist
  const renderProgress = () => {
    return (
      <div className="w-full bg-secondary rounded-full h-2.5 mb-2 overflow-hidden">
        <div 
          className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    );
  };

  return (
    <Dialog open={isVisible} onOpenChange={(open) => {
      // Only allow closing if not mandatory and not actively downloading
      if (!open && !isMandatory && status !== 'downloading') {
        dismiss();
      }
    }}>
      <DialogContent 
        className="sm:max-w-md" 
        showCloseButton={!isMandatory && status !== 'downloading'}
        onInteractOutside={(e) => {
          if (isMandatory || status === 'downloading') e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isMandatory || status === 'downloading') e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Pembaruan Tersedia
          </DialogTitle>
          <DialogDescription>
            Versi {updateInfo?.version} kini tersedia. {isMandatory ? 'Pembaruan ini wajib dipasang untuk melanjutkan penggunaan aplikasi.' : 'Apakah Anda ingin mengunduh dan memasangnya sekarang?'}
          </DialogDescription>
        </DialogHeader>

        {status === 'error' && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Kesalahan</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="my-4">
          <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md max-h-40 overflow-y-auto whitespace-pre-wrap">
            {updateInfo?.body?.replace('[MANDATORY]', '') || 'Tidak ada catatan rilis.'}
          </div>
        </div>

        {status === 'downloading' && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Mengunduh pembaruan...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            {renderProgress()}
          </div>
        )}

        {status === 'ready' && (
          <Alert className="my-2 border-emerald-500/50 text-emerald-600 bg-emerald-500/10">
            <RefreshCw className="h-4 w-4" />
            <AlertTitle>Siap Dipasang</AlertTitle>
            <AlertDescription>Pembaruan berhasil diunduh. Aplikasi akan segera dimuat ulang.</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="sm:justify-end">
          {!isMandatory && status === 'available' && (
            <Button
              type="button"
              variant="outline"
              onClick={dismiss}
            >
              Nanti Saja
            </Button>
          )}
          
          {(status === 'available' || status === 'error') && (
            <Button
              type="button"
              onClick={downloadAndInstall}
            >
              Unduh & Pasang
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
