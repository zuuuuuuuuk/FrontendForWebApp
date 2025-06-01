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
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

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
[x: string]: any;
 
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
 openedFromSales: boolean = false;
 currentProductViewImage: string = ''; 
 suggestedProductsView: ProductInterface[] = [];


 reviewRating: number = 0; // Track the rating for the review
 reviewText: string = ''; // Track the review text input by the user
 hoverRating: number = 0;

adminLoggedIn: boolean = false;

 cart: CartCreationInterface | null = null;

 private subscriptions: Subscription[] = [];

 editing: boolean = false;


  minLimit = 0;
maxLimit = 15000;

minPrice = 0;
maxPrice = 5000;



  constructor(private router: Router , private route: ActivatedRoute ,private cartService: CartService, private categoryService: CategoryService, private productService : ProductService, private authService : AuthService) {}




  
  ngOnInit(): void {
    // this.cartService.cart$.subscribe(cart => {
    //   this.cart = cart;
    //   if(!cart){
    //     console.log("cart waishalaaa");
    //   }
    // });

this.route.queryParams.subscribe(params => {
  const productId = +params['productId'];
  if (productId) {
    if (this.products && this.products.length) {
      this.openFromSale(productId);
    } else {
      // Call fetchProducts (it will populate this.products internally)
      this.fetchProducts();

      // Poll until products are available, then open the view
      const waitForProducts = setInterval(() => {
        if (this.products && this.products.length) {
          clearInterval(waitForProducts);
          this.openFromSale(productId);
        }
      }, 50); // check every 50ms
    }
  }
});

    if (this.authService.getUserRole() == "Admin"){
      this.adminLoggedIn = true;
    } else {
      this.adminLoggedIn = false;
    }
    const cartSubscription = this.cartService.cartUpdated$.subscribe(cart => {
      this.cart = cart;
      console.log('Cart updated in home component:', cart);
    });
    this.fetchCategories();
    this.fetchProducts();
    this.getUserId();
    this.userId = this.authService.getUserId();
    
    

   if (this.userId > 0) {
    const cartSubHome = this.cartService.getCartByUserrId(this.userId).subscribe({
      next: (cart: CartCreationInterface) => {
        
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
    if (this.userId > 0) {
      this.cartService.getCartByUserrId(this.userId).subscribe({
        next: (cart) => {
          // The subscription above will handle updating the cart
          console.log('Initial cart loaded in home component');
        },
        error: (err) => {
          console.error('Failed to load initial cart:', err);
        }
      });
    }
  
    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('userauthinterface');
    if (loggedInUser) {
      this.userId = this.authService.getUserId();
      this.fetchUserFavProds();
    }
  }


  enableEditingForAdmin() {
    this.editing = !this.editing;
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


updateProduct(id: number, name: string, description: string, originalPrice: string): void {
   const existing = this.products.find(p => p.id === id);

  if (!name || !name.trim()) {
    name = existing?.name || '';  // fallback empty string just in case
  }

  if (!description || !description.trim()) {
    description = existing?.description || '';
  }

  const updatedProduct = {
    name: name?.trim(),
    description: description?.trim(),
    originalPrice: +originalPrice
  }

this.productService.updateProductById(id, updatedProduct).subscribe({
  next: (response) =>{
    console.log("product updated", response);
    Swal.fire({  
      position: 'center',  
      icon: 'info',  
      title: 'product updated',
      text: 'press OK',  
      showConfirmButton: true });
  },
  error: (err) => {
    console.log("error", err);
  }
});
}

openFromSale(productId: number) {
const product = this.products.find(p => p.id === productId);
if(product) {
  this.openProductView(product);
  this.openedFromSales = true;
}
}

closeProductVIew() {
  this.showProductView = false;
  this.productView = null;
  this.reviewRating = 0;

  if (this.openedFromSales) {
    this.openedFromSales = false;
    this.router.navigate(['/Sales']);
  }
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
  this.cartService.getCartByUserrId(this.userId).subscribe({
    next: (cart) => {
      this.cart = cart;
    },
    error: (err) => {
      this.cart = null; // no cart yet
    }
  });
}


addToCart(productId: number): void {
  // Check if user is logged in
  if (!this.userId) {
    Swal.fire({
      position: 'center',
      icon: 'warning',
      title: `Please log in to add products to cart`,
      showConfirmButton: true
    });
    return; // Exit if not logged in
  }
  
  // Check if there's a valid cart with an ID > 0
  if (this.cart && this.cart.id && this.cart.id > 0) {
    console.log("Adding to existing cart:", this.cart.id);
    
    this.cartService.addToCart(this.cart.id, [productId]).subscribe({
      next: () => {
        Swal.fire({
          position: 'center',
          icon: 'success',
          title: `Product added successfully`,
          showConfirmButton: false,
          timer: 3000
        });
      },
      error: (err) => {
        console.error('Failed to add to cart:', err);
        
        // If we get a 404, it means the cart was deleted on the server
        if (err.status === 404) {
          console.log('Cart not found on server, creating new one');
          this.createNewCart(productId);
        } else {
          Swal.fire({
            position: 'center',
            icon: 'error',
            title: `Failed to add product to cart`,
            showConfirmButton: true
          });
        }
      }
    });
  } else {
    // No valid cart, create a new one
    console.log('No valid cart exists, creating new one');
    this.createNewCart(productId);
  }
}



private createNewCart(productId: number): void {
  // Ensure we have the product data
  const productIdToAdd = this.productView?.id || productId;
  
  const newCart: CartCreationInterface = {
    userId: this.userId,
    cartItems: [{ productId: productIdToAdd, quantity: 1 }]
  };
  
  const cartSub = this.cartService.initiateCart(newCart).subscribe({
    next: (createdCart) => {
      console.log('New cart created:', createdCart);
      // The cart will be updated through the subscription to cartUpdated$
      
      Swal.fire({
        position: 'center',
        icon: 'success',
        title: `Product added successfully`,
        showConfirmButton: false,
        timer: 3000
      });
    },
    error: (err) => {
      console.error('Failed to create new cart:', err);
      Swal.fire({
        position: 'center',
        icon: 'error',
        title: `Failed to create cart`,
        showConfirmButton: true
      });
    }
  });
    this.subscriptions.push(cartSub);
  
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