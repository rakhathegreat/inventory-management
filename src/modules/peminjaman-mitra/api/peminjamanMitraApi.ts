import { api } from "@/shared/lib/api";
import type { InterMitraRequest } from "../types";

export const fetchInterMitraRequests = async (): Promise<InterMitraRequest[]> => {
	const res = await api.get("/requests?type=inter-partner");
	return res.data as InterMitraRequest[];
};

export const updateInterMitraStatus = async (
	id: string,
	status: string,
	rejectionNotes?: string | null,
) => {
	const res = await api.put(`/requests/${id}/status`, {
		status,
		rejectionNotes: rejectionNotes ?? null,
	});
	return res.data;
};