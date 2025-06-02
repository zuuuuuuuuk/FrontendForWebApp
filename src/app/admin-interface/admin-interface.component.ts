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
import { SaleService } from '../services/sale.service';
import { SaleInterface } from '../interfaces/sale-interface';

@Component({
  selector: 'app-admin-interface',
  templateUrl: './admin-interface.component.html',
  styleUrls: ['./admin-interface.component.scss']
})
export class AdminInterfaceComponent implements OnInit, OnDestroy {
  productsOnSale: ProductInterface[] = [];
  allOrders: GetorderInterface[] = [];
  allSales: SaleInterface[] = [];
  allUsers: GetUserInterface[] = [];
  categories: CategoryInterface[] = [];
  mainCategories: CategoryInterface[] = [];
  subCategories: CategoryInterface[] = [];
  private subscriptions: Subscription[] = [];

  showAddCategory: boolean = false;
  activePanel: string = 'sales';
  

  constructor(private saleService: SaleService , private categoryService: CategoryService, private productService: ProductService, private cartService: CartService, private authService: AuthService) {}


  ngOnInit(): void {
   this.fetchAllOrders();
   if (this.activePanel === 'users') {
    this.fetchAllUsers();
   } else if (this.activePanel === 'categories') {
    this.fetchCategoriesForAdmin();
   } else if (this.activePanel === 'sales') {
    this.fetchAllSales();
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
  });
 }
}


fetchAllSales(): void {
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


  ngOnDestroy(): void {
    // araa sachiro unsubscribe http tied requestebistvis 
  }
}
