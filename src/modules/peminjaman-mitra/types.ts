export type InterMitraRequestItem = {
	id: string;
	category?: string;
	brand?: string;
	model?: string;
	quantity: number;
	serialNumber?: string | null;
	donorSerialNumbers?: string | null;
	receiverSerialNumbers?: string | null;
};

export type InterMitraRequest = {
	id: string;
	requestNumber: string;
	requesterName?: string;
	partnerCategory?: string;
	providerName?: string | null;
	providerPartnerId?: string | null;
	status: string;
	type?: string;
	notes: string;
	rejectionNotes?: string | null;
	requestedAt: string;
	itemsCount?: number;
	itemsDetail?: string;
	requestItems?: InterMitraRequestItem[];
	deliveryDocument?: {
		kpSignedById?: string | null;
		picSignedById?: string | null;
		driveViewUrl?: string | null;
		filePath?: string | null;
		finalFilePath?: string | null;
	} | null;
};