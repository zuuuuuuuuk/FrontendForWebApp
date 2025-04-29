import { Component, OnDestroy, OnInit } from '@angular/core';
import { CategoryInterface } from '../interfaces/category-interface';
import { CategoryService } from '../services/category.service';
import { subscribeOn, Subscription } from 'rxjs';
import { ProductInterface } from '../interfaces/product-interface';
import { ProductService } from '../services/product.service';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReviewInterface } from '../interfaces/review-interface';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CartService } from '../services/cart.service';
import { CartInterface } from '../interfaces/cart-interface';
import { CartCreationInterface } from '../interfaces/cart-create-interface';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [   // When it appears
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [   // When it disappears
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy {
 
activeCategoryId: number | null = 0;
activeProductId: number | null = 0;

  categories: CategoryInterface [] = [];
  mainCategories: CategoryInterface [] = [];
  cartItems: ProductInterface[] = [];
  products: ProductInterface [] = [];
  allProducts: ProductInterface[] = [];

  private searchSubject = new Subject<void>();

  private categorySub: Subscription = new Subscription(); 
  private productSub: Subscription = new Subscription();
  private subCategProductSub: Subscription = new Subscription();

  isFavorite: boolean = false;
  favoriteProductIds: number[] = [];
  private loginStatusSub: Subscription = new Subscription();
  userId: number = 0;
  subCategoryName: string = '';
  searchName:string = '';


 productView:ProductInterface | null = null; 
 showProductView: boolean = false;
 currentProductViewImage: string = ''; 
 suggestedProductsView: ProductInterface[] = [];


 reviewRating: number = 0; // Track the rating for the review
 reviewText: string = ''; // Track the review text input by the user
 hoverRating: number = 0;



 cart: CartInterface | null = null;

 private subscriptions: Subscription[] = [];



  minLimit = 0;
maxLimit = 15000;

minPrice = 0;
maxPrice = 5000;


  constructor(private cartService: CartService, private categoryService: CategoryService, private productService : ProductService, private authService : AuthService) {}




  
  ngOnInit(): void {
    this.fetchCategories();
    this.fetchProducts();
    this.getUserId();
    this.userId = this.authService.getUserId();

   if (this.userId > 0) {
    const cartSubHome = this.cartService.getCartByUserId(this.userId).subscribe({
      next: (cart: CartInterface) => {
        
        if(cart !== null){
          this.cart = cart;
        } else {
          console.log("no cart");
        }

      },
      
    
    });
    this.subscriptions.push(cartSubHome);
  }
    // Set up login status subscription
    this.loginStatusSub = this.authService.loggedIn$.subscribe(loggedIn => {
      if (loggedIn) {
        this.userId = this.authService.getUserId();
        this.fetchUserFavProds();
      } else {
        this.favoriteProductIds = [];
      }
    });
    this.authService.loginSuccess.subscribe(() => {
       console.log('Login success event received in HomeComponent');
        this.userId = this.authService.getUserId();
         console.log('User ID in home after login:', this.userId); 
      this.fetchUserFavProds();
     });
  
    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('userauthinterface');
    if (loggedInUser) {
      this.userId = this.authService.getUserId();
      this.fetchUserFavProds();
    }
  }



getUserId() {
  this.userId = this.authService.getUserId();
}



 public fetchUserFavProds(): void {
    this.productService.getFavorites(this.authService.getUserId()).subscribe({
      next: (favs) => {
        this.favoriteProductIds = favs;
        console.log('Fetched favorites manually:', favs);
      },
      error: (err) => console.error('error loading favorites', err)
    });
  }



  isProductFavorite(productId: number): boolean {
    // If not logged in, no favorites
    if (!this.userId) {
      return false;
    }
    return this.favoriteProductIds.includes(productId);
  }



toggleFavorite(productId: number): void {
  // Check if user is logged in
  if (!this.userId) {
    Swal.fire({  
      position: 'center',  
      icon: 'info',  
      title: 'you need to be logged in',
      text: 'press OK',  
      showConfirmButton: true  
    });
    console.log('Please log in to add favorites');
    // You could also use a service to show a modal/dialog here
    return;
  }

  

  this.productService.toggleFavorite(this.userId, productId).subscribe({
    next: (updatedFavorites: number[]) => {
      this.favoriteProductIds = updatedFavorites; // Update local favorites
      console.log('Favorites updated:', this.favoriteProductIds);
    },
    error: (err) => {
      console.error('Error toggling favorite:', err);
    }
  });
}




  fetchCategories() {
    this.categorySub = this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data.map(category => ({
          ...category,
          expanded: false
        }));
        this.mainCategories = this.categories.filter(category => category.parentId === null);
        console.log('Fetched categories:', this.categories, this.mainCategories); // Optional: Check fetched data in console
      },
      error: (err) => {
        console.error('Error fetching categories:', err);
      }
    });
    
  }



  fetchProducts() {
    this.productSub = this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.allProducts = data;
  
        // Adjust max price range to actual product range
        const prices = data.map(p => p.originalPrice);
        this.minLimit = Math.min(...prices);
        this.maxLimit = Math.max(...prices);
        this.minPrice = this.minLimit;
        this.maxPrice = this.maxLimit;
  
        this.applyFilters();
        this.subCategoryName = '';
      },
      error: (err) => {
        console.error('Error fetching products:', err);
      }
    });
  }


  hoverCategory(hoveredCategory: CategoryInterface) {
    this.mainCategories.forEach(category => {
      category.expanded = category.id === hoveredCategory.id;
    });
    this.activeCategoryId = hoveredCategory.id;
  }




  collapseAllCategories() {
    this.mainCategories.forEach(category => category.expanded = false);
    this.activeCategoryId = null;
  }
  


  getSubCategories(parentId: number): CategoryInterface[] {
    return this.categories.filter(category => category.parentId === parentId);
  }


// SubCategoryRendering ============================


renderSubcategoryData(subCategId: number, subCategoryName: string) {
this.subCategProductSub = this.productService.getProductsByCategoryId(subCategId).subscribe({
  next: (data) => {
    // aq davwer cvladshi kategoriis saxelis chasawers da html shi ngif it gamovachen roca carieli iqneba products i  
   this.allProducts = data;
   this.applyFilters();
   this.subCategoryName = subCategoryName;
  },
  error: (err) => {
    console.error('Error fetching sub products:', err);
  }
});
}



onPriceInputBlur() {
  if (this.minPrice > this.maxPrice) {
    [this.minPrice, this.maxPrice] = [this.maxPrice, this.minPrice];
    this.applyFilters(); // Re-apply after swap
  }
}

onPriceInputChange() {
  this.applyFilters();
}

onSliderChange() {
  if (this.minPrice > this.maxPrice) {
    [this.minPrice, this.maxPrice] = [this.maxPrice, this.minPrice];
  }
  this.applyFilters(); // Apply filters immediately
}

applyFilters() {
  const nameSearch = this.searchName?.trim().toLowerCase() || '';

  this.products = this.allProducts.filter(product => {
    // Check if either original price or discounted price (if available) is in range
    const priceInRange = 
      (product.originalPrice >= this.minPrice && product.originalPrice <= this.maxPrice) || 
      (product.discountedPrice > 0 && product.discountedPrice >= this.minPrice && product.discountedPrice <= this.maxPrice);
    
    // Check if product name contains the search term
    const nameMatches = product.name.toLowerCase().includes(nameSearch);
    
    return priceInRange && nameMatches;
  });
}

resetFilters(): void {
  // Reset search text
  this.searchName = '';
  
  // Reset price range to initial values
  this.minPrice = this.minLimit;
  this.maxPrice = this.maxLimit;
  
  // Apply the reset filters
  this.applyFilters();
}



nextImage(product: any) {
  if (!product.currentImageIndex && product.currentImageIndex !== 0) {
    product.currentImageIndex = 0;
  }
  product.currentImageIndex = (product.currentImageIndex + 1) % product.images.length;
}

prevImage(product: any) {
  if (!product.currentImageIndex && product.currentImageIndex !== 0) {
    product.currentImageIndex = 0;
  }
  product.currentImageIndex = (product.currentImageIndex - 1 + product.images.length) % product.images.length;
}




openProductView(product: ProductInterface) {
  this.productView = product;
  this.currentProductViewImage = product.images[0]?.url || 'assets/no-image.jpg'; // default main image
  this.showProductView = true;

  this.suggestedProductsView = this.products
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4); // Take first 4 suggested products
}

setMainImage(imgUrl: string) {
  this.currentProductViewImage = imgUrl;
}



setHoverRating(rating: number) {
  this.hoverRating = rating;
}
resetHoverRating() {
  this.hoverRating = 0;
}

setReviewRating(rating: number) {
  this.reviewRating = rating;
}

// Submit the review
submitReview() {
  if (this.reviewText && this.reviewRating > 0) {
    
    this.saveReviewToServer();
    console.log('Review submitted:', this.reviewText, this.reviewRating);
  } else {
    alert("no");
  }
  // Code to submit the review, e.g., call a service to save it.
  
}

// Method to save the review to the backend (e.g., update the product in the database)
saveReviewToServer() {
 
  if (!this.productView?.id) {
    console.error('Product ID is missing');
    return;
  } else {
    
 const review: ReviewInterface = {
  rating: this.reviewRating,
  comment: this.reviewText, 
};

this.productService.submitReview(this.userId, this.productView?.id, review)
.subscribe({
  next: (response) => {
    console.log(response.message);
    alert('review added <3');
  },
  error: (error) => {
    alert('you already submitted review on this product');
  }
}); // You can call your service here to save the review
  console.log('Review submitted with rating:', review.rating, 'and text:', review.comment);

  // Example: this.productService.submitReview(this.productView.id, rating, text).subscribe(...);
}
}

loadCart(): void {
  this.cartService.getCartByUserId(this.userId).subscribe({
    next: (cart) => {
      this.cart = cart;
    },
    error: (err) => {
      this.cart = null; // no cart yet
    }
  });
}


addToCart(productId: number): void {
  if (this.cart) {
    // User has a cart already
    this.cartService.addToCart(this.cart.id, [productId]).subscribe({
      next: (res) => {
        Swal.fire({  
          position: 'center',  
          icon: 'success',  
          title: `product added successfuly`,  
          showConfirmButton: false,  
          timer: 3000  
        });
      },
    });
  } else {
    // User does NOT have a cart -> Initiate first
    const newCart: CartCreationInterface = {
      userId: this.userId,
      cartItems: [{ productId: this.productView?.id || 0, quantity: 1 }],  // Wrap in an array // Optional expiry time
    };
    

    this.cartService.initiateCart(newCart).subscribe({
      next: (createdCart) => {
        const createdcart = {
          id: createdCart.id,
          userId: this.userId,
          cartItems: createdCart.cartItems
        }
        this.cart = createdcart; // save the new cart
        console.log('Cart created and product added');
      },
      error: (err) => {
        console.error('Failed to create cart', err);
      }
    });
  }
}


  ngOnDestroy(): void {
    if (this.categorySub) {
      this.categorySub.unsubscribe();
  }
  if (this.productSub) {
    this.productSub.unsubscribe();
  }
  if (this.loginStatusSub) {
    this.loginStatusSub.unsubscribe();
  }
  if (this.subCategProductSub) {
    this.subCategProductSub.unsubscribe();
  }
  this.subscriptions.forEach(sub => sub.unsubscribe());
}
}