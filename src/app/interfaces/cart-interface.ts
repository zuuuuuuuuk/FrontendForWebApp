import { CartItemInterface } from "./cart-item-interface";

export interface CartInterface {
    id: number;
  userId: number;
  cartItems: CartItemInterface[];
}
