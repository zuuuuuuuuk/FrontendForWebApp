import { Component, OnInit } from '@angular/core';
import { ProductService } from '../services/product.service';
import { ProductInterface } from '../interfaces/product-interface';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { SaleInterface } from '../interfaces/sale-interface';
import { SaleService } from '../services/sale.service';

@Component({
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss']
})
export class SalesComponent implements OnInit {

  productsOnSale: ProductInterface[] = [];
  allSales: SaleInterface[] = [];




   productView:ProductInterface | null = null;
  


  constructor(private saleService: SaleService , private productService: ProductService, private router: Router) {}
  ngOnInit(): void {
    this.fetchAllSales();
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

fetchAllSales(): void {
  this.saleService.getAllSales().subscribe({
    next: (response) => {
     this.allSales = response;
     console.log("sales fetched");
    },
    error: (error) => {
    console.log("sales fetching error", error);
    }
  });
}





  openProductView(productId: number) {
    this.router.navigate([''], { queryParams: { productId }});
  }

}
