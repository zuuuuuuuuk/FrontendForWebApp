import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProductInterface } from '../interfaces/product-interface';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { Subscription } from 'rxjs';
import { GetorderInterface } from '../interfaces/getorder-interface';

@Component({
  selector: 'app-admin-interface',
  templateUrl: './admin-interface.component.html',
  styleUrls: ['./admin-interface.component.scss']
})
export class AdminInterfaceComponent implements OnInit, OnDestroy {
  productsOnSale: ProductInterface[] = [];
  allOrders: GetorderInterface[] = [];
  private subscriptions: Subscription[] = [];
  constructor(private productService: ProductService, private cartService: CartService) {}


  ngOnInit(): void {
    this.fetchProductsOnSale();
    this.fetchAllOrders();
  }

  fetchAllOrders(): void {
    const orderSub = this.cartService.getAllOrders().subscribe(
      (orders: GetorderInterface[]) => {
        this.allOrders = orders;
      },
      (err) => {
          console.log('error fetching all orders:', err);
      }
    )
  }

  changeOrderStatus(orderId: number, statusInput: number) {
  const value = statusInput;
  if (value >= 0 && value <= 3) {
    this.cartService.changeOrderStatus(orderId, value).subscribe({
      next: (response) => {
        console.log('Success:', response);
        this.fetchAllOrders(); // Refresh data instead of page reload
        alert("order status updated!")
      },
      error: (error) => {
        console.log('Error updating order status:', error);
        alert('Error updating order status');
      }
    });
  } else {
    alert('please enter a number from 0 to 3');
  }
}
  
  fetchProductsOnSale(): void {
   const prodSub = this.productService.getAllProducts().subscribe(
      (products: ProductInterface[]) => {
        // Filter products that have a discounted price
        this.productsOnSale = products.filter(product => product.discountedPrice > 0);
      },
      (error) => {
        console.error('Error fetching products on sale:', error);
      }
    );
    this.subscriptions.push(prodSub);
  }



  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
