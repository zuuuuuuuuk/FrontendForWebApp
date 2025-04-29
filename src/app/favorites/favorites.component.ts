import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';
import { ProductInterface } from '../interfaces/product-interface';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription[] = [];

  userId: number = 0;
  favProdIds: number[] = [];
  favProds: ProductInterface[] = [];

  constructor(private authService: AuthService, private productService: ProductService) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    this.getFavProdIds();
  }

  getFavProdIds() {
    const favSub = this.productService.getFavorites(this.userId).subscribe({
      next: (response: number[]) => {
        console.log("favs:", response);
        this.favProdIds = response;
        this.getFavoriteProducts();  // Fetch full product data
      },
      error: (err) => {
        console.log("error: ", err);
      }
    });
    this.subscriptions.push(favSub);
  }

  getFavoriteProducts() {
    if (this.favProdIds.length === 0) return;

    const productRequests = this.favProdIds.map(id =>
      this.productService.getProductById(id)  // You must have this method in your ProductService
    );

    const prodSub = forkJoin(productRequests).subscribe({
      next: (products: ProductInterface[]) => {
        this.favProds = products;
      },
      error: (err) => {
        console.error("Failed to load favorite products:", err);
      }
    });

    this.subscriptions.push(prodSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}