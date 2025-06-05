import { ProductAvailability } from "../models/product-availability";
import { CategoryInterface } from "./category-interface";
import { GettingReviewInterface } from "./getting-review-interface";
import { ImageInterface } from "./image-interface";
import { ReviewInterface } from "./review-interface";
import { SaleInterface } from "./sale-interface";

export interface ProductInterface {
    id: number;
    categoryId: number;
    name: string;
    description: string;
    originalPrice: number;
    discountedPrice: number;
    stock: number;
    createdAt: Date;
    averageRating: number;
    sales: SaleInterface [];
    category: CategoryInterface;
    images: ImageInterface [];
    reviews: GettingReviewInterface[];
    productAvailability: ProductAvailability;
    currentImageIndex?: number;
    quantity: number;
}
