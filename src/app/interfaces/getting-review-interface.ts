import { GetUserInterface } from "./get-user-interface";

export interface GettingReviewInterface {
  id: number;
  productId: number;
  userId: number;
  user: GetUserInterface;
  rating: number;
  reviewText: string;
}

