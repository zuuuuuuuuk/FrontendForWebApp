import { Component, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { CartInterface } from '../interfaces/cart-interface';
import { CartItemInterface } from '../interfaces/cart-item-interface'; // You can define a CartItemInterface if necessary
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { ProductInterface } from '../interfaces/product-interface';
import { ProductService } from '../services/product.service';
import { CartItemCreateInterface } from '../interfaces/cart-item-create-interface';
import { CartCreationInterface } from '../interfaces/cart-create-interface';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  
  cart?: CartCreationInterface | null;
  userId: number = 0;
  cartId: number = 0;
  cartItems: CartItemCreateInterface[] = [];
  cartItemsDetailed: ProductInterface[] = [];

  cartTotalPrice: number = 0;

  error: string = '';

  constructor(private cartService: CartService, private productService: ProductService,private authService: AuthService) { }
  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    this.cartService.getCartByUserrId(this.userId).subscribe(
      (cart: CartCreationInterface) => {
        console.log(cart);
        this.cart = cart;
        if (cart.id != null){ 
        this.cartId = cart.id; // Set cart data from response
        }
        this.cartItems = cart.cartItems || [];
        this.fetchProductDetails(); // Fetch product details after cart is set
        console.log("this.cart::", this.cart);
        // Log cart after it's set
      },
      (error) => {
        this.error = 'Failed to load cart';
        console.error("Error loading cart", error);
      }
    );
   
  }

  fetchProductDetails(): void {
    this.cartItemsDetailed = []; // Clear previous product details
    this.cartTotalPrice = 0; // Reset total price
  
    // Map cartItems to product details
    this.cartItems.forEach(item => {
      this.productService.getProductById(item.productId).subscribe(
        (product: ProductInterface) => {
          // Map the product details to the corresponding cart item
          const productWithQuantity = {
            ...product,
            quantity: item.quantity
          };
          this.cartItemsDetailed.push(productWithQuantity);
          
          // Update total price (use discounted price if available)
          const price = product.discountedPrice > 0 ? product.discountedPrice : product.originalPrice;
          this.cartTotalPrice += price * item.quantity;
        },
        (error) => {
          console.error(`Failed to fetch product with ID ${item.productId}`);
        }
      );
    });
  }

addQuantityToProduct(productId: number) {
  if (!this.cart || !this.cart.id) {  // Properly check if cart and id exist
    console.error("Cart or Cart ID is undefined");
    return;
  }

  const cartId = this.cart.id; // Store the ID to use safely
  
  this.productService.getProductById(productId).subscribe({
    next: (product: ProductInterface) => {
      // Find the product in the cart
      const cartItem = this.cartItemsDetailed.find(item => item.id === productId);
      if (cartItem) {
        cartItem.quantity += 1;
        
        // Use discounted price if available, otherwise use original price
        const priceToAdd = product.discountedPrice > 0 ? product.discountedPrice : product.originalPrice;
        this.cartTotalPrice += priceToAdd; // Add the price to the total price

        // Update the cart
        this.cartService.addToCart(cartId, [productId]).subscribe({
          next: () => {
            
            this.recalculateCartTotal(); // Refresh total after server confirms
          },
          error: (error) => {
            console.error('Failed to add quantity:', error);
            // Revert local changes if the server update fails
            cartItem.quantity -= 1;
            this.cartTotalPrice -= priceToAdd;
          }
        });
      }
    },
    error: (error) => {
      console.error(`Failed to fetch product with ID ${productId}`, error);
    }
  });
}
recalculateCartTotal(): void {
  this.cartTotalPrice = 0;
  
  this.cartItemsDetailed.forEach(item => {
    // Use discounted price if available, otherwise use original price
    const price = item.discountedPrice > 0 ? item.discountedPrice : item.originalPrice;
    this.cartTotalPrice += price * item.quantity;
  });
}


removeQuantityFromProduct(productId: number) {
  if (!this.cart || !this.cart.id) {
    console.error("Cart or Cart ID is undefined");
    return;
  }

  const cartId = this.cart.id;
  
  // Find the product in the cart
  const cartItem = this.cartItemsDetailed.find(item => item.id === productId);
  
  if (cartItem && cartItem.quantity > 1) {
    // Update UI optimistically first
    cartItem.quantity -= 1;
    
    // Calculate price to subtract
    const priceToSubtract = cartItem.discountedPrice > 0 ? cartItem.discountedPrice : cartItem.originalPrice;
    this.cartTotalPrice -= priceToSubtract;
    
    // Then update on server
    this.cartService.removeFromCart(cartId, productId).subscribe({
      next: () => {
        // No need to refresh everything, we've already updated the UI
        // Just log success or do minimal updates if needed
        console.log("Quantity decreased successfully");
      },
      error: (error) => {
        // Revert the UI change if there's an error
        console.error('Failed to decrease quantity:', error);
        cartItem.quantity += 1;
        this.cartTotalPrice += priceToSubtract;
        // Now refresh from server to ensure synchronization
        this.refreshCartData();
      }
    });
  } else if (cartItem && cartItem.quantity === 1) {
    // If quantity is 1, prompt user to remove item instead
    if (confirm("Remove item from cart?")) {
      this.removeProductFromCart(productId);
    }
  }
}

removeProductFromCart(productId: number): void {
  this.cartService.removeProductFromCart(this.cartId, productId).subscribe({
    next: () => {
      // Successfully removed the product
      this.recalculateCartTotal(); // Optionally recalculate the total
      this.refreshCartData(); // Reload the cart or update UI
    },
    error: (error) => {
      console.error('Failed to remove product:', error);
    }
  });
}

refreshCartData(): void {
  this.cartService.getCartByUserrId(this.userId).subscribe(
    (cart: CartCreationInterface) => {
      this.cart = cart;
      this.cartItems = cart.cartItems || [];
      // Clear previous details and recalculate
      this.cartItemsDetailed = [];
      this.cartTotalPrice = 0;
      this.fetchProductDetails();
    },
    (error) => {
      this.error = 'Failed to refresh cart';
      console.error("Error refreshing cart", error);
    }
  );
}
}

