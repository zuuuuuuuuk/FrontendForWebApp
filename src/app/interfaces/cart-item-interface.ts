import { SaleInterface } from "./sale-interface";
import { CategoryInterface } from "./category-interface";
import { ImageInterface } from "./image-interface";
import { ReviewInterface } from "./review-interface";
import { ProductAvailability } from "../models/product-availability";

export interface CartItemInterface {
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
       reviews: ReviewInterface [];
       productAvailability: ProductAvailability;
       currentImageIndex?: number;
       quantity: number;
}
