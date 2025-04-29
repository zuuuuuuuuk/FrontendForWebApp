import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProductInterface } from '../interfaces/product-interface';
import { ProductService } from '../services/product.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-interface',
  templateUrl: './admin-interface.component.html',
  styleUrls: ['./admin-interface.component.scss']
})
export class AdminInterfaceComponent implements OnInit, OnDestroy {
  productsOnSale: ProductInterface[] = [];
  private subscriptions: Subscription[] = [];
  constructor(private productService: ProductService) {}


  ngOnInit(): void {
    this.fetchProductsOnSale();
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
