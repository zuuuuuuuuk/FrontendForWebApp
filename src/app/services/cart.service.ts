import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CartComponent } from '../cart/cart.component';
import { CartInterface } from '../interfaces/cart-interface';
import { CartItemInterface } from '../interfaces/cart-item-interface';
import { CartCreationInterface } from '../interfaces/cart-create-interface';
import { CartItemCreateInterface } from '../interfaces/cart-item-create-interface';
import { GetorderInterface } from '../interfaces/getorder-interface';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartSubject = new BehaviorSubject<CartCreationInterface | null>(null);
  cartUpdated$ = this.cartSubject.asObservable();

private initiateCartApiUrl = 'https://localhost:7219/api/Cart/create';
private addToCartApiUrl = 'https://localhost:7219/api/Cart/add-products';
private removeFromCartApiUrl = 'https://localhost:7219/api/Cart/remove-product-quantity/7?productId=14';
private getCartByUserIdApiUrl = 'https://localhost:7219/api/Cart/userId?userId=';
private removeProductFromCartApiUrl = 'https://localhost:7219/api/Cart/remove-product';
private createOrderApiUrl = 'https://localhost:7219/api/Order';
private processPaymentApiUrl = 'https://localhost:7219/api/Payment/process';
private getAllOrdersApiUrl = 'https://localhost:7219/api/Order';
private getOrdersByUserIdApiUrl = 'https://localhost:7219/api/Order/get-orders';

  constructor(private http: HttpClient) { }


  initiateCart(cart: CartCreationInterface): Observable<any> {
    return this.http.post(`${this.initiateCartApiUrl}`, cart).pipe(
      tap(createdCart => {
        // Update the cart subject when a new cart is created
        this.cartSubject.next(createdCart as CartCreationInterface);
      })
    );
  }

  addToCart(cartId: number, cartItemIds: number[]): Observable<number[]> {
    console.log(cartId, cartItemIds);
    return this.http.put<number[]>(`${this.addToCartApiUrl}/${cartId}`, cartItemIds).pipe(
      tap(() => {
        // After successful add, refresh the cart to get updated state
        this.refreshCartForUser();
      })
    );
  }

  removeFromCart(cartId: number, productId: number): Observable<any> {
    return this.http.delete<any>(`https://localhost:7219/api/Cart/remove-product-quantity/${cartId}?productId=${productId}`).pipe(
      tap(() => {
        // After successful removal, refresh the cart
        this.refreshCartForUser();
      })
    );
  }


  removeProductFromCart(cartId: number, productId: number): Observable<string> {
    const url = `https://localhost:7219/api/Cart/remove-product/${cartId}?productId=${productId}`;
    
    // Specify the response type as 'text' to handle the plain string response
    return this.http.delete<string>(url, { responseType: 'text' as 'json' }).pipe(
      tap(() => {
        // After successful removal, refresh the cart
        this.refreshCartForUser();
      })
    );
  }

  getCartByUserId(userId: number): Observable<CartInterface> {
    return this.http.get<CartInterface>(`${this.getCartByUserIdApiUrl}${userId}`)
      .pipe(
        tap(cart => {
          // Also update the cart subject with this cart
          this.cartSubject.next(cart as unknown as CartCreationInterface);
        }),
        catchError(error => {
          if (error.status === 400 || error.status === 404) {
            console.log(`No cart found for user ${userId}`);
            // Return an empty cart object that matches the CartInterface
            const emptyCart = {
              id: 0,
              userId: userId,
              cartItems: []
            } as CartInterface;
            
            this.cartSubject.next(emptyCart as unknown as CartCreationInterface);
            return of(emptyCart);
          }
          this.cartSubject.next(null);
          return throwError(error);
        })
      );
  }


  getCartByUserrId(userId: number): Observable<CartCreationInterface> {
    return this.http.get<CartCreationInterface>(`${this.getCartByUserIdApiUrl}${userId}`)
      .pipe(
        tap(cart => {
          // Update the cart subject with the retrieved cart
          this.cartSubject.next(cart);
        }),
        catchError(error => {
          // Return an empty cart object instead of propagating the error
          if (error.status === 404 || error.status === 400) {
            const emptyCart = {
              id: 0,
              userId: userId,
              cartItems: []
            } as CartCreationInterface;
            
            this.cartSubject.next(emptyCart);
            return of(emptyCart);
          }
          this.cartSubject.next(null);
          return throwError(error);
        })
      );
  }

  private refreshCartForUser(): void {
    const currentCart = this.cartSubject.getValue();
    if (currentCart && currentCart.userId) {
      this.getCartByUserrId(currentCart.userId).subscribe();
    }
  }

  createOrder(userId: number, orderItems: CartItemCreateInterface[], shippingAddress: string, paymentMethod: string, promoCode: string): Observable<any> {
    const order = {
      userId: userId,
      orderItems: orderItems,
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod,
      promoCode: promoCode
    };
    return this.http.post<any>(`${this.createOrderApiUrl}`, order);
  }

  clearCart(): void {
    // Clear the cart in the behavior subject
    this.cartSubject.next(null);
    console.log('Cart cleared in service');
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

  getOrdersByUserId(userId: number):Observable<GetorderInterface[]> {
    return this.http.get<GetorderInterface[]>(`https://localhost:7219/api/Order/get-orders/${userId}`);
  }

  getAllOrders(): Observable<GetorderInterface[]> {
    return this.http.get<GetorderInterface[]>(this.getAllOrdersApiUrl);
  }


  changeOrderStatus(orderId: number, orderStatus: number): Observable <number> {
    return this.http.put<number>(`https://localhost:7219/api/Order/${orderId}/status?status=${orderStatus}`, {}, { responseType: 'text' as 'json' });
  }

  
}
