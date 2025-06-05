import { Component, OnDestroy, OnInit, ChangeDetectorRef  } from '@angular/core';
import { ProductInterface } from '../interfaces/product-interface';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { Subscription } from 'rxjs';
import { GetorderInterface } from '../interfaces/getorder-interface';
import { GetUserInterface } from '../interfaces/get-user-interface';
import { AuthService } from '../services/auth.service';
import { CategoryInterface } from '../interfaces/category-interface';
import { CategoryService } from '../services/category.service';
import { SaleService } from '../services/sale.service';
import { SaleInterface } from '../interfaces/sale-interface';
import { AddSaleInterface } from '../interfaces/add-sale-interface';
import { NavigationEnd, Router } from '@angular/router';
import { ItemStatInterface } from '../interfaces/item-stat-interface';

@Component({
  selector: 'app-admin-interface',
  templateUrl: './admin-interface.component.html',
  styleUrls: ['./admin-interface.component.scss']
})
export class AdminInterfaceComponent implements OnInit, OnDestroy {
  productsOnSale: ProductInterface[] = [];
  allProducts: ProductInterface[] = [];
  
  allOrders: GetorderInterface[] = [];
  
  itemStats: ItemStatInterface[] = [];
  isLoading: boolean = false;

  userEditing: boolean = false;

  allSales: SaleInterface[] = [];
  allUsers: GetUserInterface[] = [];
  categories: CategoryInterface[] = [];
  mainCategories: CategoryInterface[] = [];
  subCategories: CategoryInterface[] = [];
  private subscriptions: Subscription[] = [];


  

  saleName: string = '';
  saleDiscountValue: number | null = null;
  saleDescription: string = '';
  saleProductIds: number[] = []; 
  saleNameEditing: boolean = false;
  saleDescriptionEditing: boolean = false;
  saleDiscountValueEditing: boolean = false;
  activatingSale: boolean = false;

  showAddCategory: boolean = false;
  showAddSale: boolean = false;
  activePanel: string = '';
  showActivateInput: boolean = false;

  constructor(private cd: ChangeDetectorRef, private router: Router , private saleService: SaleService , private categoryService: CategoryService, private productService: ProductService, private cartService: CartService, private authService: AuthService) {}


  async ngOnInit(): Promise<void> {
   await this.createChartWithSimpleRetry();

  // Check if this is a fresh navigation to admin (not a refresh)
  const isRefresh = sessionStorage.getItem('adminPageLoaded');
  
  if (!isRefresh) {
    // First time loading admin page - clear saved panel and default to orders
    localStorage.removeItem('activePanel');
    sessionStorage.setItem('adminPageLoaded', 'true');
    this.activePanel = 'orders';
  } else {
    // This is a refresh - use saved panel
    const savedPanel = localStorage.getItem('activePanel');
    if(savedPanel === 'sales'){
      this.fetchAllSales();
    } else if(savedPanel === 'categories'){
      this.fetchCategoriesForAdmin();
    } else if(savedPanel === 'users') {
      this.fetchAllUsers();
    }
    this.activePanel = savedPanel || 'orders';
  }
}

private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

getProductName(productId: number) {
  const product = this.allProducts.find(p => p.id === productId);
  return product ? product.name : 'unknown';
}


  fetchAllOrders(): void {
    this.cartService.getAllOrders().subscribe(
      (orders: GetorderInterface[]) => {
        this.allOrders = orders;
        this.createStats();
      },
      (err) => {
          console.log('error fetching all orders:', err);
      }
    )
  }
 

  ///////// chart funqcia ////////////////////////////
  ////////////////////////////////////////////////////
  ////////////////////////////////////////////////////

  async createChartWithSimpleRetry(): Promise<void> {
    console.log('Creating chart...');
    
    // Try 3 times
    for (let i = 1; i <= 3; i++) {
      console.log(`Attempt ${i}/3`);
      
      try {
        await this.createStatsWithFreshData();
        
        // Check if we got good results
        if (this.itemStats.length > 0) {
          console.log('Chart created successfully!');
          return; // Success! Stop trying
        }
        
      } catch (error) {
        console.log(`Attempt ${i} failed:`, error);
      }
      
      // Wait 1 second before trying again (except on last attempt)
      if (i < 3) {
        console.log('Waiting 1 second...');
        await this.sleep(1000);
      }
    }
    
    console.log('All attempts failed');
  }



  async createStatsWithFreshData(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Step 1: Get fresh data from server (no cache)
      console.log('Loading fresh data...');
      await this.loadFreshData();
      
      // Step 2: Make sure we actually got data
      if (this.allOrders.length === 0) {
        throw new Error('No orders loaded');
      }
      
      if (this.allProducts.length === 0) {
        throw new Error('No products loaded');
      }
      
      // Step 3: Create the chart (your original logic)
      console.log('Creating chart...');
      this.createStatsOriginal();
      
    } finally {
      this.isLoading = false;
    }
  }



    private async loadFreshData(): Promise<void> {
    // Clear old data first
    this.allOrders = [];
    this.allProducts = [];
    
    // Load orders
    console.log('Loading orders...');
    this.allOrders = await this.cartService.getAllOrders().toPromise() || [];
    console.log(`Got ${this.allOrders.length} orders`);
    
    // Load products
    console.log('Loading products...');
    this.allProducts = await this.productService.getAllProducts().toPromise() || [];
    console.log(`Got ${this.allProducts.length} products`);
  }

   createStats(): void {
    const itemCounts = new Map<string, number>();

    // Count items
    this.allOrders.forEach(order => {
      order.orderItems?.forEach(item => {
        const name = this.getProductName(item.productId);
        itemCounts.set(name, (itemCounts.get(name) || 0) + (item.quantity || 1));
      });
    });

    // Convert to array and sort
    const sorted = Array.from(itemCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    // Get max count for percentage calculation
    const maxCount = sorted[0]?.[1] || 1;

    // Create stats with percentages
    this.itemStats = sorted.map(([name, count]) => ({
      name,
      count,
      percentage: (count / maxCount) * 100
    }));

    this.cd.detectChanges();
    console.log('Item Statistics:', this.itemStats);
  }

  private createStatsOriginal(): void {
    const itemCounts = new Map<string, number>();
    
    this.allOrders.forEach(order => {
      order.orderItems?.forEach(item => {
        const name = this.getProductName(item.productId);
        // Only count items that have real names (not 'unknown')
        if (name && name !== 'unknown') {
          itemCounts.set(name, (itemCounts.get(name) || 0) + (item.quantity || 1));
        }
      });
    });
    
    const sorted = Array.from(itemCounts.entries())
      .sort((a, b) => b[1] - a[1]);
    
    const maxCount = sorted[0]?.[1] || 1;
    
    this.itemStats = sorted.map(([name, count]) => ({
      name,
      count,
      percentage: (count / maxCount) * 100
    }));
    
    console.log(`Created chart with ${this.itemStats.length} items`);
  }

  fetchAllProducts(): void {
     this.productService.getAllProducts().subscribe({
      next: (response) => {
         this.allProducts = response;
         console.log("allProds fetched");
      },
      error: (error) => {
         console.log("error fetching allProds", error);
      }
    });
  }

   async refreshChart(): Promise<void> {
    console.log('Manual refresh triggered');
    await this.createChartWithSimpleRetry();
  }


  fetchAllUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (response) => {
      this.allUsers = response;
      console.log("user fetching worksss");
      console.log(response);
      },
     
      error: (error) => {
        console.log("user fetching error", error);
      }
      
    })
  }

  changeOrderStatus(orderId: number, statusInput: number) {
  const value = statusInput;
  if (value >= 0 && value <= 3 && value != null) {
      this.cartService.changeOrderStatus(orderId, value).subscribe({
      next: (response) => {
        console.log('Success:', response);
        this.fetchAllOrders(); // Refresh data instead of page reload
        alert("order status updated!")
      },
      error: (error) => {
        console.log('Error updating order status:', error);
        alert('Error updating order status');
      }
      
    });
  } else {
    alert('please enter a number from 0 to 3');
  }
  
}
  
  fetchProductsOnSale(): void {
   this.productService.getAllProducts().subscribe(
      (products: ProductInterface[]) => {
        // Filter products that have a discounted price
        this.productsOnSale = products.filter(product => product.discountedPrice > 0);
      },
      (error) => {
        console.error('Error fetching products on sale:', error);
      }
    );
  }

  switchPanel(panel: string): void {
    this.activePanel = panel;
     localStorage.setItem('activePanel', panel);
    if (panel === 'orders') {
      this.fetchAllOrders();
    } else if (panel === 'users') {
      this.fetchAllUsers();
    } else if (panel === 'categories') {
      this.fetchCategoriesForAdmin();
    } else if (panel === 'sales') {
      this.fetchAllSales();
    }
  }


  fetchCategoriesForAdmin() {
  this.categoryService.getCategories().subscribe({
   next: (response) => {
    this.categories = response;
    this.mainCategories = response.filter(c => c.parentId === null);
    this.subCategories = response.filter(c => c.parentId !== null);
   },
   error: (error) => {
   console.error('categories fetching errr', error);
   }
  });
  }

getSubcategoriesForParent(parentId: number): CategoryInterface[] {
  return this.subCategories?.filter(c => c.parentId === parentId) || [];
}

addCategory(categoryName: string, parentId: string, description: string, imageUrl: string, subCategoryIds: string): void {
  // Convert parentId input string to number or null if empty
  const parsedParentId = parentId ? Number(parentId) : null;

  // Convert subCategoryIds string ("1,2,3") to number array or empty array if empty
  const subcategories = subCategoryIds
    ? subCategoryIds.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id))
    : [];

  // Create the category payload
  const category: CategoryInterface = {
    id: 0,                    // or omit if backend generates it
    name: categoryName,
    parentId: parsedParentId,
    description,
    image: imageUrl,
    subcategories
  };

  // Call your service method
  this.categoryService.addCategory(category).subscribe({
    next: (response) => {
      console.log('Category added successfully:', response);
      this.fetchCategoriesForAdmin();
      alert('Category added successfully!');
    },
    error: (error) => {
      console.log('Error while adding category', error);
      alert('Error with adding category');
    }
  });
}

removeCategory(categoryId: number) {
 if (confirm('Are you sure you want to delete this category?')) {
  this.categoryService.removeCategory(categoryId).subscribe(() => {
    alert('category removed');
    this.fetchCategoriesForAdmin();
  });
 }
}


fetchAllSales(): void {
  this.activePanel = 'sales';
  this.saleService.getAllSales().subscribe({
    next: (response) => {
      this.allSales = response;
      console.log("sales fetched");
    },
    error: (error) => {
      console.log("error fetching sales", error);
    }
  });
}

toggleProduct(productId: number): void {
  const index = this.saleProductIds.indexOf(productId);
  if (index === -1) {
    this.saleProductIds.push(productId);
  } else {
    this.saleProductIds.splice(index, 1);
  }
}

addSale() {
  const payload: AddSaleInterface = {
    name: this.saleName,
    discountValue: this.saleDiscountValue,
    description: this.saleDescription,
    productIdsOnThisSale: this.saleProductIds
  }
  if(this.saleName == '' || this.saleDescription == '' || this.saleDiscountValue == null) {
    alert("name, description and value % are required")
  }
this.saleService.addSale(payload).subscribe({
   next: (response) => {
    console.log(this.saleProductIds, typeof this.saleProductIds);
    console.log("sale added");
    alert("sale added succesfully!");
    this.fetchAllSales();
    this.saleName = '';
    this.saleDescription = '';
    this.saleDiscountValue = null;
    this.saleProductIds = [];
   },
   error: (error) => {
    console.log("error adding sale", error);
   }
});
}

removeSale(saleId: number) {
    const confirmed = window.confirm("Are you sure you want to delete this sale?");
  if (!confirmed) return;
this.saleService.removeSale(saleId).subscribe({
next: (response) =>{
alert("sale removed");
this.fetchAllSales();
},
error: (error) => {
  console.log("error removing sale", error);
}
});
}

removeProductFromSale(saleId: number, productId: number){

  this.saleService.removeProductFromSale(saleId, [productId]).subscribe({
    next: (response) => {
     console.log("prod removed from sale");
     alert("product removed");
     this.fetchAllSales();
    },
    error: (error) => {
      console.log("error removing product from sale", error);
    }
  });
}



editSaleName(saleId: number, name: string) {
this.saleService.changeSale(saleId, name, "string", 0).subscribe({
  next: (response) => {
    alert("sale name updated");
    this.saleNameEditing = false;
    this.fetchAllSales();
  },
  error: (error) => {
    console.log("error updating sale name", error)
  }
});

}

editSaleDescription(saleId: number, description: string) {
   
this.saleService.changeSale(saleId, "string", description, 0).subscribe({
  next: (response) => {
    alert("sale description updated");
    this.saleDescriptionEditing = false;
    this.fetchAllSales();
  },
  error: (error) => {
    console.log("error updating sale descruiption", error)
  }
});
}

editSaleDiscountValue(saleId: number, discountValue: string) {
this.saleService.changeSale(saleId, "string", "string", +discountValue).subscribe({
  next: (response) => {
    this.saleDiscountValueEditing = false;
    alert("sale discount value updated");
    this.fetchAllSales();
  },
  error: (error) => {
    console.log("error updating sale discount value", error)
  }
});
}


activateSale(saleId: number, days: string) {
this.saleService.activateSale(saleId, +days).subscribe({
  next: (response) => {
    alert(`sale activated for ${days} days`);
    this.fetchAllSales();
    console.log("sale activated");
    this.activatingSale = false;
  },
  error: (error) => {
    console.log("error activating sale", error);
  }
});
}


deactivateSale(saleId: number) {
  this.saleService.deactivateSale(saleId).subscribe({
    next: (response) => {
      alert("sale deactivated");
      this.fetchAllSales();
     console.log("sale deactivated");
    },
    error: (error) => {
     console.log("error deactivating sale", error);
    }
  });
}

removeOrder(orderId: number) {
   const confirmed = window.confirm("Are you sure you want to remove this order?");
   if(!confirmed) return;
this.cartService.deleteOrder(orderId).subscribe({
  next: (response) => {
    alert("order removed");
    console.log("order removed");
    this.fetchAllOrders();
  },
  error: (error) => {
    console.log("error removing order", error);
  }
});
}


deleteUser(userId: number) {
    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if(!confirmed) return;
this.authService.deleteUser(userId).subscribe({
  next: (response) => {
   console.log("user deleted");
   alert("user deleted");
   this.fetchAllUsers();
  },
  error: (error) => {
    console.log("error deleting user", error);
  }
});
}


  getDaysLeft(sale: SaleInterface): number {
  const now = new Date(); // local time
  const endDate = new Date(sale.endsAt); // ensure it's a Date object

  // Round both dates to midnight for clean day comparison
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const diffMs = endMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays >= 0 ? diffDays : 0;
}


getSaleClass(sale: SaleInterface): string {
  const daysLeft = this.getDaysLeft(sale);
  if (daysLeft <= 5) return 'daysEnd0';
  if (daysLeft <= 10) return 'daysEnd5';
  if (daysLeft <= 20) return 'daysEnd10';
  return 'daysEnd20';
}


updateUser(userId: number, role: string | null, firstName: string | null, lastName: string | null) {
    const confirmed = window.confirm("Are you sure you want to apply edit to this user?");
    if(!confirmed) return;
  this.authService.getUserById(userId).subscribe({
    next: (user) => {
      const payload = {
        role: role && role.trim() !== '' ? role : user.role,
        firstName: firstName && firstName.trim() !== '' ? firstName : user.firstName,
        lastName: lastName && lastName.trim() !== '' ? lastName : user.lastName
      };

      this.authService.updateUser(userId, payload).subscribe({
        next: (res) => {
          alert("user updated");
          this.userEditing = false;
          this.fetchAllUsers();
          console.log('User updated:', res)
        },
        error: (err) => console.error('Update failed:', err)
      });
    },
    error: (error) => {
      console.error("User not found", error);
    }
  });
}


  ngOnDestroy(): void {
    sessionStorage.removeItem('adminPageLoaded');
    // araa sachiro unsubscribe http tied requestebistvis 
  }
}
