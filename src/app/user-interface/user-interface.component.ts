import { Component, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { Router, ActivatedRoute, NavigationStart } from '@angular/router';
import { filter, lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { ProductInterface } from '../interfaces/product-interface';
import { GetorderInterface } from '../interfaces/getorder-interface';
import { Subscription, forkJoin } from 'rxjs';
import { ProductService } from '../services/product.service';
import { GetUserInterface } from '../interfaces/get-user-interface';
import { GetAddressInterface } from '../interfaces/get-address-interface';
import { PostAddressInterface } from '../interfaces/post-address-interface';
import { BuyVoucherInterface } from '../interfaces/buy-voucher-interface';
import { GetVoucherInterface } from '../interfaces/get-voucher-interface';

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

  userVouchers: GetVoucherInterface[] = []; 
  availableNonGlobalVouchers: GetVoucherInterface[] = [];

  deliveryAddresses: GetAddressInterface[] = [];
  deliveryAddress: string = ''; 

  buyingPromo: boolean = false;
  promoToBuyId: number = 0;
  promoSuccess: boolean = false;
  promoCode: string = '';
  activePanel: string = '';
  
  voucherPaymentMethod: string = '';
  voucherCardNumber: string = '';
  voucherCvv: number | null = null;
  voucherExpiration: string = '';
  selectedVoucherId: number = 0;

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


this.getAllAddressesForUser(this.userId);
this.fetchNonGlobalPromos();
this.fetchVouchersForUser();
}


buyPromoVoucher(promoId: number) {
  const userId = this.userId;
  const confirmed = window.confirm("do you want to proceed and buy?");
    if(!confirmed) return;

    // virtual payment check for voucher only endpoint
    // =======
    if(this.voucherCardNumber.length < 16 || !this.voucherCvv || this.voucherCvv < 1 || !this.voucherExpiration){
    alert("fields must be filled correctly");
    }  
this.authService.buyPromoVoucher(userId, promoId).subscribe({
  next: (response) => {
    alert("voucher has been bought successfully");
   console.log("voucher bought", response);
  },
  error: (error) => {
    alert(error?.error?.message);
    console.log("error buying voucher", error);
  }
});
}

fetchVouchersForUser(){
  
this.authService.getPromosByUserId(this.userId).subscribe({
  next: (response) => {
    this.userVouchers = response;
    console.log("user vouchers fetched");
  },
  error: (error) => {
    console.log("error fetching userPromos", error);
  }
});
}

fetchNonGlobalPromos(){
  this.availableNonGlobalVouchers = [];
this.authService.getAllPromos().subscribe({
  next: (response) => {
  console.log("all Promos Fetched");
  // logic for prohibiting already bought coucher source display
  this.availableNonGlobalVouchers = response.filter(promo => !promo.isGlobal && promo.sourcePromoId == null && promo.isUsed == false && promo.ownerUserId != this.userId);

},
  error: (error) => {
    console.log("error fetching all promos", error);
  }
});
}

async getAllAddressesForUser(userId: number) {
  try {
    const response = await lastValueFrom(
      this.authService.getDeliveryAddressesByUserId(userId)
    );
    this.deliveryAddresses = response;
    console.log("addresses work", response);
  } catch (error) {
    console.log("error fetching userAddresses", error);
  }
}

async postAddressByUserId() {
  const address = {
    address: this.deliveryAddress,
    isDefault: false
  }
  try {
    const response = await lastValueFrom(this.authService.postDeliveryAddressByUserId(this.userId, address));
    console.log('Address POST response:', response);
    // Now fetch all addresses again to update the list:
    await this.getAllAddressesForUser(this.userId);
  } catch (error) {
    console.error('Error adding address:', error);
  }
}


async getAddressById(userId: number, addressId: number): Promise<GetAddressInterface | undefined> {
  try {
    const addresses = await lastValueFrom(this.authService.getDeliveryAddressesByUserId(userId));
    return addresses.find(addr => addr.id === addressId);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return undefined;
  }
}

async setDefaultAddress(addressId: number) {
  try {
    // Get all addresses first
    const allAddresses = await lastValueFrom(this.authService.getDeliveryAddressesByUserId(this.userId));

    // Loop and update each one
    for (const addr of allAddresses) {
      const isDefault = addr.id === addressId;

      const updated = {
        address: addr.address,
        isDefault: isDefault
      };

      await lastValueFrom(
        this.authService.putDeliveryAddressByUserId(this.userId, addr.id, updated)
      );
    }

    // Refresh list after all updates
    await this.getAllAddressesForUser(this.userId);
    console.log('Default address updated.');
  } catch (error) {
    console.error('Error updating default address:', error);
  }
}

async deleteAddressByUserId(addressId: number) {
    const confirmed = window.confirm("Are you sure you want to delete this address?");
    if(!confirmed) return;
  try {
    const response = await lastValueFrom(this.authService.deleteDeliveryAddressByUserId(this.userId, addressId));
    console.log('Delete response:', response);
    // Refresh the whole address list after delete
    await this.getAllAddressesForUser(this.userId);
  } catch (error) {
    console.error('Error deleting address:', error);
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
            orderItems: [] ,
            promoCode: order.promoCode,
            totalAmount: order.totalAmount,
            createdAt: order.createdAt
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