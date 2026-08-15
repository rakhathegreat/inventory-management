import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

const getBaseUrl = () => {
  const baseUrl = import.meta.env.URL || import.meta.env.VITE_URL || "http://localhost:3000/";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

export default function GoogleOAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasExchanged = useRef(false);

  useEffect(() => {
    if (hasExchanged.current) return;

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Gagal menghubungkan Google", {
        description: error === "access_denied" ? "Akses ditolak." : error,
      });
      navigate("/pengaturan", { replace: true });
      return;
    }

    if (!code) {
      toast.error("Kode OAuth tidak ditemukan.");
      navigate("/pengaturan", { replace: true });
      return;
    }

    if (!user?.id) return;

    hasExchanged.current = true;

    const exchangeCode = async () => {
      try {
        const token = localStorage.getItem("arxiva-auth-token");
        if (!token) {
          toast.error("Sesi login tidak ditemukan. Silakan login ulang.");
          navigate("/login", { replace: true });
          return;
        }

        const res = await fetch(`${getBaseUrl()}/auth/google/exchange`, {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, userId: user.id }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Gagal menukar kode OAuth");
        }

        toast.success("Akun Google berhasil terhubung", {
          description: data.googleEmail || undefined,
        });
        navigate("/pengaturan", { replace: true });
      } catch (err: any) {
        toast.error(err.message || "Gagal menghubungkan akun Google.");
        navigate("/pengaturan", { replace: true });
      }
    };

    void exchangeCode();
  }, [searchParams, user?.id, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      <span>Menghubungkan akun Google...</span>
    </div>
  );
}
