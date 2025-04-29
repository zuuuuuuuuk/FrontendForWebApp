import { Component, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { ProductInterface } from '../interfaces/product-interface';
import { GetorderInterface } from '../interfaces/getorder-interface';
import { Subscription, forkJoin } from 'rxjs';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-user-interface',
  templateUrl: './user-interface.component.html',
  styleUrls: ['./user-interface.component.scss']
})
export class UserInterfaceComponent implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  orders: GetorderInterface[] = [];
  fullOrders: any[] = [];
  userId: number = 0;
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    this.getOrders();
  }

  getOrders() {
    const orderSub = this.cartService.getOrdersByUserId(this.userId).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.fullOrders = []; // Reset

        // Process each order
        orders.forEach(order => {
          // Create initial order payload
          const orderPayload: any = {
            id: order.id,
            status: order.status,
            orderItems: [] // Initialize as empty array to avoid duplication
          };

          // Create an array of product observables for this order
          const productObservables = order.orderItems.map(orderItem => 
            this.productService.getProductById(orderItem.productId)
          );

          // If there are order items, fetch their details
          if (productObservables.length > 0) {
            const productsSub = forkJoin(productObservables).subscribe({
              next: (products) => {
                // Combine order items with product details
                orderPayload.orderItems = order.orderItems.map((orderItem, index) => {
                  return {
                    id: orderItem.productId,
                    discountedPrice: orderItem.discountedPrice,
                    price: orderItem.price,
                    quantity: orderItem.quantity,
                    productId: orderItem.productId,
                    productName: products[index]?.name || 'Unknown Product'
                  };
                });
                
                // Add the complete order to fullOrders
                this.fullOrders.push(orderPayload);
              },
              error: (err) => {
                console.error('Failed to fetch product details for order', order.id, err);
                // Still add the order but with limited product info
                orderPayload.orderItems = order.orderItems.map(item => ({
                  ...item,
                  productName: 'Product info unavailable'
                }));
                this.fullOrders.push(orderPayload);
              }
            });
            
            this.subscriptions.push(productsSub);
          } else {
            // If no order items, just add the order with empty items array
            this.fullOrders.push(orderPayload);
          }
        });
      },
      error: (err) => {
        console.error("Failed to fetch orders:", err);
      }
    });
    
    this.subscriptions.push(orderSub);
  }

  getStatusLabel(status: number): string {
    return status === 1 ? 'paid' : status === 0 ? 'pending' : 'unknown';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}