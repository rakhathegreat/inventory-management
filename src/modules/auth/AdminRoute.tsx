import { Navigate } from "react-router-dom";
import { useAuth } from "@/modules/auth/auth";
import type { ReactNode } from "react";

/** Pembatas route khusus admin: non-admin diarahkan senyap ke dashboard. */
export default function AdminRoute({ children }: { children: ReactNode }) {
	const { user } = useAuth();

	if (!user) {
		return <Navigate to="/login" replace />;
	}
	if (user.role !== "admin") {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
}
