import { ProductInterface } from "./product-interface";

export interface SaleInterface {
    id: number;
    name: string;
    discountValue: number;
    description: string;
    startsAt: Date;
    endsAt: Date;
    isActive: boolean;
    productsOnThisSale: ProductInterface[];
}
