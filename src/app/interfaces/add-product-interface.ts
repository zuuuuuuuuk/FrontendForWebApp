import { AddImageInterface } from "./add-image-interface";
import { ImageInterface } from "./image-interface";

export interface AddProductInterface {
    name: string;
    description: string;
    originalPrice: number;
    categoryId: number;
    stock: number;
    images: AddImageInterface[];
}
