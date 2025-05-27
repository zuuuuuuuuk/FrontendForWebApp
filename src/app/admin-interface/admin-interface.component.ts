import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProductInterface } from '../interfaces/product-interface';
import { ProductService } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { Subscription } from 'rxjs';
import { GetorderInterface } from '../interfaces/getorder-interface';
import { GetUserInterface } from '../interfaces/get-user-interface';
import { AuthService } from '../services/auth.service';
import { CategoryInterface } from '../interfaces/category-interface';
import { CategoryService } from '../services/category.service';

@Component({
  selector: 'app-admin-interface',
  templateUrl: './admin-interface.component.html',
  styleUrls: ['./admin-interface.component.scss']
})
export class AdminInterfaceComponent implements OnInit, OnDestroy {
  productsOnSale: ProductInterface[] = [];
  allOrders: GetorderInterface[] = [];
  allUsers: GetUserInterface[] = [];
  categories: CategoryInterface[] = [];
  mainCategories: CategoryInterface[] = [];
  subCategories: CategoryInterface[] = [];
  private subscriptions: Subscription[] = [];

  activePanel: string = 'categories';

  constructor(private categoryService: CategoryService, private productService: ProductService, private cartService: CartService, private authService: AuthService) {}


  ngOnInit(): void {
   this.fetchAllOrders();
   if (this.activePanel === 'users') {
    this.fetchAllUsers();
   } else if (this.activePanel === 'categories') {
    this.fetchCategoriesForAdmin();
   }
  }

  fetchAllOrders(): void {
    this.cartService.getAllOrders().subscribe(
      (orders: GetorderInterface[]) => {
        this.allOrders = orders;
      },
      (err) => {
          console.log('error fetching all orders:', err);
      }
    )
  }

  fetchAllUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (response) => {
      this.allUsers = response;
      console.log("user fetching worksss");
      },
     
      error: (error) => {
        console.log("user fetching error");
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

    if (panel === 'orders') {
      this.fetchAllOrders();
    } else if (panel === 'users') {
      this.fetchAllUsers();
    } else if (panel === 'categories') {
      this.fetchCategoriesForAdmin();
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

addCategory(category: CategoryInterface): void {
  this.categoryService.addCategory(category).subscribe({
    next: (response) => {
      console.log('Category added successfully:', response);
      this.fetchCategoriesForAdmin(); 
      alert('Category added successfully!');
    },
   error: (error) => {
console.log('error while adding');
alert('error with adding');
   }
  });
}

  ngOnDestroy(): void {
    // araa sachiro unsubscribe http tied requestebistvis 
  }
}
