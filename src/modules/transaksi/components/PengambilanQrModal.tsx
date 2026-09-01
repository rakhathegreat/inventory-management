import { useEffect, useState, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Loader2, PackageCheck, RefreshCw, Clock, Building2, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { api, getBaseUrl } from "@/shared/lib/api";
import type { DashboardRequest } from "@/modules/transaksi/types";

interface PengambilanQrModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  request: DashboardRequest | null;
  onSuccess?: () => void;
}

const SESSION_TIMEOUT_SECONDS = 900; // 15 menit — sesuai expiry backend

export function PengambilanQrModal({
  isOpen,
  onOpenChange,
  request,
  onSuccess,
}: PengambilanQrModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(SESSION_TIMEOUT_SECONDS);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Refs agar initSession/refreshQr stabil — tidak ikut berubah saat parent re-render,
  // sehingga useEffect tidak memicu regenerasi QR berulang (kedip/ganti cepat).
  const requestRef = useRef(request);
  requestRef.current = request;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const initLockRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPolling = useCallback((sessId: string, onComplete: () => void) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const pollRes = await api.get(`/signature-session/${sessId}`);
        if (pollRes.data.status === "COMPLETED") {
          clearTimers();
          toast.success("Pengambilan material berhasil! BAST telah diselesaikan.");
          onComplete();
        }
      } catch (err: any) {
        if (err.response?.status === 400 && err.response?.data?.message === "Session expired") {
          void initSession();
        }
      }
    }, 2000);
  }, [clearTimers]);

  const startCountdown = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const initSession = useCallback(async () => {
    const req = requestRef.current;
    if (!req || initLockRef.current) return;
    initLockRef.current = true;
    setIsLoading(true);
    setQrCodeDataUrl("");
    setTimeLeft(SESSION_TIMEOUT_SECONDS);

    try {
      const res = await api.post("/signature-session", { requestId: req.id });
      const sessId = res.data.id;

      const backendBaseUrl = getBaseUrl();
      const mobileUrl = `${backendBaseUrl}/signature-session/${sessId}/mobile`;
      const qrData = await QRCode.toDataURL(mobileUrl, { width: 320, margin: 2 });

      setQrCodeDataUrl(qrData);
      setIsLoading(false);

      startPolling(sessId, () => {
        onSuccessRef.current?.();
        onOpenChangeRef.current(false);
      });
      startCountdown();
    } catch (err: any) {
      toast.error("Gagal membuat sesi QR Code Pengambilan");
      setIsLoading(false);
    } finally {
      initLockRef.current = false;
    }
  }, [startPolling, startCountdown]);

  // Refresh hanya QR — tanpa loading overlay penuh
  const refreshQr = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const req = requestRef.current;
    if (!req || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await api.post("/signature-session", { requestId: req.id });
      const sessId = res.data.id;
      const backendBaseUrl = getBaseUrl();
      const mobileUrl = `${backendBaseUrl}/signature-session/${sessId}/mobile`;
      const qrData = await QRCode.toDataURL(mobileUrl, { width: 320, margin: 2 });
      setQrCodeDataUrl(qrData);
      setTimeLeft(SESSION_TIMEOUT_SECONDS);

      startPolling(sessId, () => {
        onSuccessRef.current?.();
        onOpenChangeRef.current(false);
      });
      startCountdown();
    } catch {
      toast.error("Gagal memperbarui QR Code.");
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, startPolling, startCountdown]);

  const requestId = request?.id;
  useEffect(() => {
    if (isOpen && requestId) {
      void initSession();
    } else {
      clearTimers();
    }

    return () => {
      clearTimers();
    };
  }, [isOpen, requestId, initSession, clearTimers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col items-center text-center p-6 gap-4">
        <DialogHeader className="w-full text-center space-y-1">
          <DialogTitle className="flex items-center justify-center gap-2 text-lg font-bold">
            <PackageCheck className="size-5 text-emerald-500" />
            Pengambilan Material
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Scan QR Code dari HP penerima untuk tanda tangan penyerahan barang
          </DialogDescription>
        </DialogHeader>

        {/* Request Context Summary Card */}
        {request && (
          <div className="w-full bg-muted/50 rounded-xl p-3 border text-xs space-y-1.5 text-left">
            <div className="flex items-center justify-between font-semibold border-b pb-1.5">
              <span className="text-primary">{request.requestNumber}</span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">
                {request.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground pt-0.5">
              <div className="flex items-center gap-1.5">
                <Building2 className="size-3.5 text-emerald-500 shrink-0" />
                <span className="truncate font-medium text-foreground">{request.requesterName || "Mitra"}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Layers className="size-3.5 text-blue-500 shrink-0" />
                <span className="font-medium text-foreground">
                  {request.itemsCount || request.requestItems?.length || 0} Item Material
                </span>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="my-6 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="size-10 animate-spin text-emerald-500" />
            <p className="text-xs text-muted-foreground font-medium">Membuat Sesi QR Code Baru...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3 w-full">
            {/* QR Code Container with Pulsing Ring Indicator */}
            <div className="relative group">
              <div className="absolute -inset-1 rounded-3xl group-hover:opacity-50 transition-all" />
              <div className="relative p-3.5 bg-white rounded-2xl border shadow-md border-zinc-200">
                <img src={qrCodeDataUrl} alt="QR Code Pengambilan BAST" className="w-52 h-52 rounded-xl" />
              </div>
            </div>

            {/* Live Connection Status & Countdown Timer */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 h-6 px-3 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="leading-none">Sesi Aktif</span>
              </div>
              <div className="flex items-center gap-1 h-6 text-xs text-muted-foreground bg-muted px-2.5 rounded-full border">
                <Clock className="size-3 text-amber-500 shrink-0" />
                <span className="leading-none tabular-nums">{formatTime(timeLeft)}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Minta penerima/PIC meng-scan QR Code ini dari HP untuk mengisi <strong>Nama</strong> & <strong>Tanda Tangan</strong>.
            </p>

            <Button
              variant="ghost"
              size="sm"
              disabled={isRefreshing}
              onClick={refreshQr}
              className="text-xs gap-1.5 text-muted-foreground hover:text-foreground h-8">
              <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Memperbarui..." : "Refresh"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
