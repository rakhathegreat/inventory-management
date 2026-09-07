import type { DashboardSummary } from "@/modules/dashboard/types";

export const getBaseUrl = () => {
    const baseUrl = import.meta.env.URL || import.meta.env.VITE_URL || "http://172.168.9.139:3000/";
    return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

export const getHeaders = () => {
    const token = localStorage.getItem("arxiva-auth-token");
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `${token}`;
    }
    return headers;
};

export const DashboardService = {
    /** Ambil seluruh agregat dashboard dalam SATU panggilan ringan. */
    async fetchSummary(signal?: AbortSignal): Promise<DashboardSummary> {
        const res = await fetch(`${getBaseUrl()}/dashboard/stats/summary`, {
            method: "GET",
            headers: getHeaders(),
            signal,
        });
        if (!res.ok) {
            throw new Error(`Dashboard summary request failed (${res.status})`);
        }
        const raw = await res.json();
        return raw.data || raw;
    },
};