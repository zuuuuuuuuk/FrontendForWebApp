import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CartComponent } from '../cart/cart.component';
import { CartInterface } from '../interfaces/cart-interface';
import { CartItemInterface } from '../interfaces/cart-item-interface';
import { CartCreationInterface } from '../interfaces/cart-create-interface';
import { CartItemCreateInterface } from '../interfaces/cart-item-create-interface';



@Injectable({
  providedIn: 'root'
})
export class CartService {

private initiateCartApiUrl = 'https://localhost:7219/api/Cart/create';
private addToCartApiUrl = 'https://localhost:7219/api/Cart/add-products';
private removeFromCartApiUrl = 'https://localhost:7219/api/Cart/remove-product-quantity/7?productId=14';
private getCartByUserIdApiUrl = 'https://localhost:7219/api/Cart/userId?userId=';
private removeProductFromCartApiUrl = 'https://localhost:7219/api/Cart/remove-product';


  constructor(private http: HttpClient) { }


  initiateCart(cart: CartCreationInterface): Observable<any> {
 
  return this.http.post(`${this.initiateCartApiUrl}`, cart);
  }

  addToCart(cartId: number, cartItemIds: number[]): Observable<number[]> {
    console.log(cartId, cartItemIds);
   return this.http.put<number[]>(`${this.addToCartApiUrl}/${cartId}`, cartItemIds);
  }

  removeFromCart(cartId: number, productId: number): Observable<any> {
    
    return this.http.delete<any>(`https://localhost:7219/api/Cart/remove-product-quantity/${cartId}?productId=${productId}`);
  }

  removeProductFromCart(cartId: number, productId: number): Observable<string> {
    const url = `https://localhost:7219/api/Cart/remove-product/${cartId}?productId=${productId}`;
    
    // Specify the response type as 'text' to handle the plain string response
    return this.http.delete<string>(url, { responseType: 'text' as 'json' });
  }

  getCartByUserId(userId: number): Observable<CartInterface>{
return this.http.get<CartInterface>(`${this.getCartByUserIdApiUrl}${userId}`);
  }

  getCartByUserrId(userId: number): Observable<CartCreationInterface> {
    return this.http.get<CartCreationInterface>(`${this.getCartByUserIdApiUrl}${userId}`);
  }
  
}
