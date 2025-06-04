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


  getDaysLeft(sale: SaleInterface): number {
  const now = new Date(); // local time
  const endDate = new Date(sale.endsAt); // ensure it's a Date object

  // Round both dates to midnight for clean day comparison
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const diffMs = endMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays >= 0 ? diffDays : 0;
}


getSaleClass(sale: SaleInterface): string {
  const daysLeft = this.getDaysLeft(sale);
  if (daysLeft <= 5) return 'daysEnd0';
  if (daysLeft <= 10) return 'daysEnd5';
  if (daysLeft <= 20) return 'daysEnd10';
  return 'daysEnd20';
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
