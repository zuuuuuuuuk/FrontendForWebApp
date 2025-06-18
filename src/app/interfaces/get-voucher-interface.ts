export interface GetVoucherInterface {
    id: number;
    name: string;
    description: string;
    code: string;
    discountValue: number;
    ownerUserId?: number;
    isUsed: boolean;
    isGlobal: boolean;
    sourcePromoId?: number;
}
