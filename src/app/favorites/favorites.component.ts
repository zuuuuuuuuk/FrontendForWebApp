import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';
import { ProductInterface } from '../interfaces/product-interface';
import { Subscription } from 'rxjs';

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

constructor(private authService: AuthService, private productService: ProductService) { }
  
ngOnInit(): void {
   this.getUserId();
   this.getFavProdIds();
  }

getFavProdIds() {
 const favSub = this.productService.getFavorites(this.userId).subscribe({
next: (response) => {
  console.log("favs:", response);
  this.favProdIds = response;
},
error: (err) => {
  console.log("error: ", err)
}
  });
}

getUserId(){
 this.userId = this.authService.getUserId();
}





  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
