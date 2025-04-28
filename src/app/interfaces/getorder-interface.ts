import { GetOrderOrderitemInterface } from "./get-order-orderitem-interface";

export interface GetorderInterface {
    id: number;
    userId: number;
    orderItems: GetOrderOrderitemInterface[];
    status: number;
    totalAmount: number;
    promoCode: string;
    shippingAddress: string;
    paymentMethod: string;
    paymentInfo: string;
    createdAt: Date;
}
