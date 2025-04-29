import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProductInterface } from '../interfaces/product-interface';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-admin-interface',
  templateUrl: './admin-interface.component.html',
  styleUrls: ['./admin-interface.component.scss']
})
export class AdminInterfaceComponent implements OnInit, OnDestroy {
  productsOnSale: ProductInterface[] = [];

  constructor(private productService: ProductService) {}


  ngOnInit(): void {
    this.fetchProductsOnSale();
  }
  
  fetchProductsOnSale(): void {
    this.productService.getAllProducts().subscribe(
      (products: ProductInterface[]) => {
        // Filter products that have a discounted price
        this.productsOnSale = products.filter(product => product.discountedPrice > 0);
      },
      (error) => {
        console.error('Error fetching products on sale:', error);
      }
    );
  }



  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }
}
