import { Component, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { CartInterface } from '../interfaces/cart-interface';
import { CartItemInterface } from '../interfaces/cart-item-interface'; // You can define a CartItemInterface if necessary
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductInterface } from '../interfaces/product-interface';
import { ProductService } from '../services/product.service';
import { CartItemCreateInterface } from '../interfaces/cart-item-create-interface';
import { CartCreationInterface } from '../interfaces/cart-create-interface';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { GetorderInterface } from '../interfaces/getorder-interface';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit, OnDestroy {
  
  cart?: CartCreationInterface | null;
  order?: GetorderInterface | null;
  userId: number = 0;
  cartId: number = 0;
  cartItems: CartItemCreateInterface[] = [];
  cartItemsDetailed: ProductInterface[] = [];


  checkOutPage: boolean = false;

  cartTotalPrice: number = 0;
  discountedTotal: number = 0;
  private subscriptions: Subscription[] = [];
  error: string = '';
  promoCode: string = '';
  shippingAddress: string = '';
  paymentMethod: string = '';
  cardNumber: string = '';
  expirationDate: string = '';
  cvv: string ='';
  total: number = 0;
  

  constructor(private cartService: CartService, private productService: ProductService,private authService: AuthService) { }
  ngOnInit(): void {
    this.userId = this.authService.getUserId();


    if(this.userId > 0){
      
    const cartSub = this.cartService.getCartByUserrId(this.userId).subscribe(
      (cart: CartCreationInterface) => {
        if(cart != null) {
        console.log(cart);
        this.cart = cart;
        if (cart.id != null){ 
        this.cartId = cart.id; // Set cart data from response
        } 
        this.cartItems = cart.cartItems || [];
        this.fetchProductDetails(); // Fetch product details after cart is set
        console.log("this.cart::", this.cart);
        // Log cart after it's set
      } else {
        console.log("user has no cart yet");
      }
      },
      (error) => {
        if (error.status === 400) {
          console.log("No cart found for this user.");
          this.cart = null;
        } 
      }
    );
    this.subscriptions.push(cartSub);
  } else {
    console.log("user is not logged in yet to load cart");
  }
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
  if (!this.cart?.id) return;

  const cartId = this.cart.id;
  const cartItem = this.cartItemsDetailed.find(item => item.id === productId);

  if (!cartItem) return;

  if (cartItem.quantity > 1) {
    cartItem.quantity--;
    const priceChange = cartItem.discountedPrice > 0 ? cartItem.discountedPrice : cartItem.originalPrice;
    this.cartTotalPrice -= priceChange;

    this.cartService.removeFromCart(cartId, productId).subscribe({
      next: () => {
        console.log("Quantity decreased successfully");
        // NO refresh here
      },
      error: (error) => {
        console.error('Failed to decrease quantity:', error);
        cartItem.quantity++;
        this.cartTotalPrice += priceChange;
      }
    });
  } else {
    if (confirm("Remove item from cart?")) {
      this.cartItemsDetailed = this.cartItemsDetailed.filter(item => item.id !== productId);

      const priceChange = cartItem.discountedPrice > 0 ? cartItem.discountedPrice : cartItem.originalPrice;
      this.cartTotalPrice -= priceChange;

      this.cartService.removeFromCart(cartId, productId).subscribe({
        next: () => console.log('Item removed'),
        error: (error) => {
          console.error('Failed to remove item:', error);
          // Optional: fetch cart again if needed
        }
      });
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
      if (error.status === 404) {
        this.cart = null;  // Handle cart not found
        console.log("Cart is empty or deleted.");
      } else {
        console.error("Error loading cart", error);
      }
    }
  );
}

goToCheckOut() {
this.checkOutPage = true;
}

checkOut() {
  const orderSub = this.cartService.createOrder(this.userId,this.cartItems,this.shippingAddress,this.paymentMethod,this.promoCode).subscribe({
    next: (order) => {

      console.log("order: ", order)
      const paymentSub = this.cartService.processPayment(order.id,this.cardNumber,this.expirationDate,this.cvv,this.total).subscribe({
        next: (payment) => {
          console.log('Payment successful', payment);
          Swal.fire({  
            position: 'center',  
            icon: 'success',  
            title: `Payment successful`,  
            showConfirmButton: false,  
            timer: 3000  
          });
          
        },
        error: (error) => {
          console.error('Payment error:', error);
          Swal.fire({  
            position: 'center',  
            icon: 'error',  
            title: `Payment failed`,  
            text: 'Please check your payment details',
            showConfirmButton: true  
          });
        }
        
        
      });
      this.subscriptions.push(paymentSub);

      console.log('Order created successfully', order);
      this.order = order;
      Swal.fire({  
        position: 'center',  
        icon: 'success',  
        title: `Order created successfully`,  
        showConfirmButton: false,  
        timer: 3000  
      });
    
      this.cartItemsDetailed = [];
      this.cartTotalPrice = 0;
      this.checkOutPage = false;
    },
    error: (error) => {
      console.error('Order creation failed', error);
      Swal.fire({  
        position: 'center',  
        icon: 'error',  
        title: `Order creation failed`,  
        showConfirmButton: true  
      });
    }
  });
  
  this.subscriptions.push(orderSub);
}


  




ngOnDestroy(): void {
  // Unsubscribe from all subscriptions
  this.subscriptions.forEach(sub => sub.unsubscribe());
}
  
 }
