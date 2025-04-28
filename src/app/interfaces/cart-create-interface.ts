import { CartItemCreateInterface } from "./cart-item-create-interface";

export interface CartCreationInterface {
    id?: number;
  userId: number;
  cartItems: CartItemCreateInterface[];
}
