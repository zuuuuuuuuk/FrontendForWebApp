import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CartComponent } from '../cart/cart.component';
import { CartInterface } from '../interfaces/cart-interface';
import { CartItemInterface } from '../interfaces/cart-item-interface';
import { CartCreationInterface } from '../interfaces/cart-create-interface';
import { CartItemCreateInterface } from '../interfaces/cart-item-create-interface';
import { GetorderInterface } from '../interfaces/getorder-interface';



@Injectable({
  providedIn: 'root'
})
export class CartService {

private initiateCartApiUrl = 'https://localhost:7219/api/Cart/create';
private addToCartApiUrl = 'https://localhost:7219/api/Cart/add-products';
private removeFromCartApiUrl = 'https://localhost:7219/api/Cart/remove-product-quantity/7?productId=14';
private getCartByUserIdApiUrl = 'https://localhost:7219/api/Cart/userId?userId=';
private removeProductFromCartApiUrl = 'https://localhost:7219/api/Cart/remove-product';
private createOrderApiUrl = 'https://localhost:7219/api/Order';
private processPaymentApiUrl = 'https://localhost:7219/api/Payment/process';
private getAllOrdersApiUrl = '';
private getOrderByUserIdApiUrl = 'https://localhost:7219/api/Order';

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

  getCartByUserId(userId: number): Observable<CartInterface> {
    return this.http.get<CartInterface>(`${this.getCartByUserIdApiUrl}${userId}`)
      .pipe(
        catchError(error => {
          if (error.status === 400 || error.status === 400) {
            console.log(`No cart found for user ${userId}`);
            // Return an empty cart object that matches the CartInterface
            return of({
              id: 0,
              userId: userId,
              cartItems: []
            } as CartInterface);
          }
          throw error;
        })
      );
  }

  getCartByUserrId(userId: number): Observable<CartCreationInterface> {
    return this.http.get<CartCreationInterface>(`${this.getCartByUserIdApiUrl}${userId}`)
      .pipe(
        catchError(error => {
          // Return an empty cart object instead of propagating the error
          if (error.status === 404 || error.status === 400) {
            return of({
              id: 0,
              userId: userId,
              cartItems: []
            } as CartCreationInterface);
          }
          throw error;
        })
      );
  }
  createOrder(userId: number, orderItems: CartItemCreateInterface[], shippingAddress: string, paymentMethod: string, promoCode: string): Observable<any> {
  const order = {
   userId: userId,
   orderItems: orderItems,
   shippingAddress: shippingAddress,
   paymentMethod: paymentMethod,
   promoCode: promoCode
  }
    return this.http.post<any>(`${this.createOrderApiUrl}`, order);
  }

  processPayment(orderId: number, cardNumber: string, expirationDate: string, cvv: string, amount: number): Observable<any>{
   const payment = {
    orderId: orderId,
    cardNumber: cardNumber,
    expirationDate: expirationDate,
    cvv: cvv,
    amount: amount,
   }
   
    return this.http.post<any>(`${this.processPaymentApiUrl}`, payment);
  }

  getOrderByUserId(userId: number):Observable<GetorderInterface> {
    return this.http.get<GetorderInterface>(`https://localhost:7219/api/Order/${userId}`);
  }


  

  getAllOrders() {

  }

  

  
}
