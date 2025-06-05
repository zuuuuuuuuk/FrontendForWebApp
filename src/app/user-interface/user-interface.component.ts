import { Component, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { filter } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { ProductInterface } from '../interfaces/product-interface';
import { GetorderInterface } from '../interfaces/getorder-interface';
import { Subscription, forkJoin } from 'rxjs';
import { ProductService } from '../services/product.service';
import { GetUserInterface } from '../interfaces/get-user-interface';

@Component({
  selector: 'app-user-interface',
  templateUrl: './user-interface.component.html',
  styleUrls: ['./user-interface.component.scss']
})
export class UserInterfaceComponent implements OnInit, OnDestroy {
  constructor(
    
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  orders: GetorderInterface[] = [];
  fullOrders: any[] = [];
  userId: number = 0;
  private subscriptions: Subscription[] = [];
  statusSteps: string[] = ['Pending', 'Paid', 'Shipped', 'Delivered'];
  user: GetUserInterface | null = null;
  userEditing: boolean = false;

  activePanel: string = '';
  
ngOnInit(): void {



  this.router.events
  .pipe(filter(event => event instanceof NavigationStart))
  .subscribe((event) => {
  if (event instanceof NavigationStart) {
    if (!event.url.startsWith('/User')) {
      sessionStorage.removeItem('userPageLoaded');
      sessionStorage.removeItem('userManualSwitch');
      sessionStorage.removeItem('userActivePanel');
      console.log('Left /User — session state cleared');
    }
  }
});

  this.userId = this.authService.getUserId();

    this.authService.getUserById(this.userId).subscribe({
    next: (response) => {
      this.user = response;
      console.log("user fetched", response);
    },
    error: (error) => {
      console.log("error fetching user", error);
    }
  });

  const requestedPanel = this.route.snapshot.queryParams['panel'];
  const isFirstLoad = !sessionStorage.getItem('userPageLoaded');
  const manualSwitch = sessionStorage.getItem('userManualSwitch') === 'true';

  if (isFirstLoad && !manualSwitch) {

    let initialPanel = requestedPanel === 'userInfo' ? 'userInfo' : 'orders';
    this.activePanel = initialPanel;
    sessionStorage.setItem('userActivePanel', initialPanel);
    console.log('First load from nav - panel:', initialPanel);
  } else {

    const savedPanel = sessionStorage.getItem('userActivePanel');
    this.activePanel = savedPanel || 'orders';
    console.log('Reload or post-switch - panel:', this.activePanel);
  }

  sessionStorage.setItem('userPageLoaded', 'true');

  if (this.activePanel === 'orders') {
    this.getOrders();
  }
}

getFillWidthPercent(status: number): number {
  const totalSteps = this.statusSteps.length - 1;
  return (status / totalSteps) * 100;
}



  switchPanel(panel: string): void {
  this.activePanel = panel;
  sessionStorage.setItem('userActivePanel', panel);
  sessionStorage.setItem('userManualSwitch', 'true'); // <-- flag manual switch
  console.log('Manually switched to panel:', panel);

  if (panel === 'orders') {
    this.getOrders();
  }
}

  getOrders() {
    const orderSub = this.cartService.getOrdersByUserId(this.userId).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.fullOrders = []; // Reset

        // Process each order
        orders.forEach(order => {
   
          const orderPayload: any = {
            id: order.id,
            status: order.status,
            orderItems: [] 
          };

          const productObservables = order.orderItems.map(orderItem => 
            this.productService.getProductById(orderItem.productId)
          );
          if (productObservables.length > 0) {
            const productsSub = forkJoin(productObservables).subscribe({
              next: (products) => {
                orderPayload.orderItems = order.orderItems.map((orderItem, index) => {
                  return {
                    id: orderItem.productId,
                    discountedPrice: orderItem.discountedPrice,
                    price: orderItem.price,
                    quantity: orderItem.quantity,
                    productId: orderItem.productId,
                    productName: products[index]?.name || 'Unknown Product'
                  };
                });
                this.fullOrders.push(orderPayload);
              },
              error: (err) => {
                console.error('Failed to fetch product details for order', order.id, err);
                orderPayload.orderItems = order.orderItems.map(item => ({
                  ...item,
                  productName: 'Product info unavailable'
                }));
                this.fullOrders.push(orderPayload);
              }
            });
            this.subscriptions.push(productsSub);
          } else {

            this.fullOrders.push(orderPayload);
          }
        });
      },
      error: (err) => {
        console.error("Failed to fetch orders:", err);
      }
    });
    
    this.subscriptions.push(orderSub);
  }

  getStatusLabel(status: number): string {
    return status === 1 ? 'paid' : status === 0 ? 'pending' : 'unknown';
  }

  updateUser(firstName: string | null, lastName: string | null) {
     const confirmed = window.confirm("Are you sure you want to apply edit to your profile?");
    if(!confirmed) return;
  this.authService.getUserById(this.userId).subscribe({
    next: (response) => {
    const payload = {
        role: response.role,
        firstName: firstName && firstName.trim() !== '' ? firstName : response.firstName,
        lastName: lastName && lastName.trim() !== '' ? lastName : response.lastName
    };

    
  this.authService.updateUser(this.userId, payload).subscribe({
    next: (res) => {
    alert("changes applied to your profile");
    this.userEditing = false;
    this.authService.getUserById(this.userId).subscribe({
      next: (res) =>{
        this.user = res; ///////
      },
     error: (err) => {
      console.log("error fetching user", err);
     }
    });
    },
    error: (err) => {
      console.log("error updating user", err);
    }
  });
    },
    error: (error) => {
      console.log("user not found", error);
    }
  });

  }


  ngOnDestroy(): void {
    sessionStorage.removeItem('userPageLoaded');
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}