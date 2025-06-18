import { Component, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { CartInterface } from '../interfaces/cart-interface';
import { CartItemInterface } from '../interfaces/cart-item-interface'; // You can define a CartItemInterface if necessary
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { lastValueFrom, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductInterface } from '../interfaces/product-interface';
import { ProductService } from '../services/product.service';
import { CartItemCreateInterface } from '../interfaces/cart-item-create-interface';
import { CartCreationInterface } from '../interfaces/cart-create-interface';
import { Subscription } from 'rxjs';
import { GetorderInterface } from '../interfaces/getorder-interface';
import { GetAddressInterface } from '../interfaces/get-address-interface';


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
  newAddressText: string = '';
  isAddingNewAddress: boolean = false;
  paymentMethod: string = '';
  cardNumber: string = '';
  expirationDate: string = '';
  cvv: string ='';
  total: number = 0;
  router: any;
  
  deliveryAddresses: GetAddressInterface[] = [];
  selectedAddressId?: number;



  constructor(private cartService: CartService, private productService: ProductService,private authService: AuthService) { }
  ngOnInit(): void {
    this.userId = this.authService.getUserId();

  
    this.loadUserAddresses();

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
    this.total = 0; // Reset total price
  
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
          this.total += price * item.quantity;
          
          console.log("total=================",this.total);
          
        },
        (error) => {
          console.error(`Failed to fetch product with ID ${item.productId}`);
        }
      );
    });
  }


async loadUserAddresses() {
  try {
    this.deliveryAddresses = await lastValueFrom(this.authService.getDeliveryAddressesByUserId(this.userId));
    // Optionally pre-select default address
    const defaultAddr = this.deliveryAddresses.find(addr => addr.isDefault);
    if (defaultAddr) {
      this.selectedAddressId = defaultAddr.id;
    }
  } catch (error) {
    console.error('Failed to load addresses', error);
  }
}

onAddressChange(event: any): void {
  const selectedValue = event.target.value;
  this.isAddingNewAddress = selectedValue === 'new';
  if (this.isAddingNewAddress) {
    this.selectedAddressId = undefined;
  }
}



addQuantityToProduct(productId: number) {
  if (!this.cart || !this.cart.id) {  
    console.error("Cart or Cart ID is undefined");
    return;
  }

  const cartId = this.cart.id; 
  
  this.productService.getProductById(productId).subscribe({
    next: (product: ProductInterface) => {
      // Find the product in the cart
      const cartItem = this.cartItemsDetailed.find(item => item.id === productId);
      if (cartItem) {
        cartItem.quantity += 1;
        
        // Use discounted price if available, otherwise use original price
        const priceToAdd = product.discountedPrice > 0 ? product.discountedPrice : product.originalPrice;
        this.total += priceToAdd; // Add the price to the total price

        // Update the cart
        this.cartService.addToCart(cartId, [productId]).subscribe({
          next: () => {
            
            this.recalculateCartTotal(); // Refresh total after server confirms
          },
          error: (error) => {
            console.error('Failed to add quantity:', error);
            // Revert local changes if the server update fails
            cartItem.quantity -= 1;
            this.total -= priceToAdd;
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
    this.total -= priceChange;

    this.cartService.removeFromCart(cartId, productId).subscribe({
      next: () => {
        console.log("Quantity decreased successfully");
        // NO refresh here
      },
      error: (error) => {
        console.error('Failed to decrease quantity:', error);
        cartItem.quantity++;
        this.total += priceChange;
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

async checkOut() {
  if (!this.selectedAddressId) {
    alert('Please select a shipping address.');
    return;
  }

  const selectedAddressObj = this.deliveryAddresses.find(addr => addr.id === this.selectedAddressId);
  if (!selectedAddressObj) {
    alert('Selected address not found!');
    return;
  }

  // ✅ Assign to class-level variable instead of creating a local one
  this.shippingAddress = selectedAddressObj.address;

  try {
    const order = await lastValueFrom(
      this.cartService.createOrder(
        this.userId,
        this.cartItems,
        this.shippingAddress, // ✅ Use class-level variable
        this.paymentMethod,
        this.promoCode
      )
    );

    console.log("order:", order);
    console.log("total:", this.total);

    const payment = await lastValueFrom(
      this.cartService.processPayment(
        order.id,
        this.cardNumber,
        this.expirationDate,
        this.cvv,
        this.total
      )
    );

    alert("Order paid ❤️");
    console.log("Payment successful:", payment);

    this.cartService.clearCart();
    this.cartItemsDetailed = [];
    this.total = 0;
    this.checkOutPage = false;
    this.cartId = 0;
    this.cart = null;
    this.order = order;

  } catch (error: any) {
    console.error('Checkout error:', error);
    if (error?.error && typeof error.error === 'string') {
      alert(`checkout failed: ${error.error}`);
    } else if (error?.error?.message) {
      alert(`checkout failed: ${error.error.message}`);
    } else {
      alert('An unexpected error occurred during checkout');
    }
  }
}






ngOnDestroy(): void {
  // Unsubscribe from all subscriptions
  this.subscriptions.forEach(sub => sub.unsubscribe());
}
  
 }
