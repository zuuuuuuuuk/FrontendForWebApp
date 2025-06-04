import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';
import { ProductInterface } from '../interfaces/product-interface';
import { Subscription, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

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

  constructor(private router: Router, private authService: AuthService, private productService: ProductService) {}

    adCurrentIndex: number = 0;

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    this.getFavProdIds();
       setInterval(() => {
      this.nextImage();
    }, 3000); // 3 seconds
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


  toggleFavorite(productId : number){
  this.productService.toggleFavorite(this.userId, productId).subscribe({
   next: (response) => {
   console.log("favorite toggled! <3");
   Swal.fire({  
      position: 'center',  
      icon: 'info',  
      title: 'product removed from favorites',
      
      showConfirmButton: true  
    });
    this.favProds = this.favProds.filter(p => p.id !== productId);
   },
   error: (error) => {
   console.log("error during toggling favorite ://");
   }
  });
  }


  openProductView(productId: number) {
    this.router.navigate([''], { queryParams: {productId: productId, name: 'favorites' }});
  }


    adImages: string[] = [
    'https://img.youtube.com/vi/pxPYaVOMqlY/maxresdefault.jpg',
    'https://i.work.ua/employer_gallery/7/5/6/20756.jpg',
    'https://hovorymo.live/assets/images/articles/cheverdak/dlya-kartinok-na-govorimo-4-1.png',
    'https://itstep.school.ge/wp-content/uploads/2024/01/%E1%83%A1%E1%83%99%E1%83%9D%E1%83%9A%E1%83%98%E1%83%A1-%E1%83%A1%E1%83%A2%E1%83%A0%E1%83%A3%E1%83%A5%E1%83%A2%E1%83%A3%E1%83%A0%E1%83%90-.png'
  ];

  
  nextImage(): void {
    this.adCurrentIndex = (this.adCurrentIndex + 1) % this.adImages.length;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}