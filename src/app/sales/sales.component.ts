import { Component, OnInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { ProductInterface } from '../interfaces/product-interface';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss']
})
export class SalesComponent implements OnInit {
  productsOnSale: ProductInterface[] = [];

   productView:ProductInterface | null = null;
   showProductView: boolean = false;


  constructor(private productService: ProductService, private router: Router) {}
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


  openProductView(productId: number) {
    this.router.navigate([''], { queryParams: { productId }});
  }

}
