import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserAuth } from '../interfaces/Auth-interfaces/userAuth';
import { AuthService } from '../services/auth.service';
import { HomeComponent } from '../home/home.component';
import { Token } from '@angular/compiler';
import Swal from 'sweetalert2';
import { Router, Route, ActivatedRoute } from '@angular/router';
import { ImageInterface } from '../interfaces/image-interface';
import { AddImageInterface } from '../interfaces/add-image-interface';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit, OnDestroy {

  productAddImages: AddImageInterface[] = [];
  newImage: AddImageInterface = { description: '', url: '' } ;

  userId: number = 0;
  AdminLoggedIn: boolean = false;
  showLogin: boolean = true;
  loggedIn: boolean = false;
  errorMessage: string = '';
  regError: string = '';
  showRegister: boolean = false;
  showProdInp: boolean = false;

  registerData = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  }

  userAuth = {
    email: '',
    password: ''
  };
  userResponse = {
    id: 0,
    email: '',
    role: 0, 
    token: ''
  };


  constructor(private productService: ProductService , private router: Router, private http: HttpClient, private authService: AuthService) {}
 

  ngOnInit(): void {
    
    

     
    const loggedInUser = localStorage.getItem('userauthinterface');
    this.showRegister = false;
    if (loggedInUser) {
      this.userResponse = JSON.parse(loggedInUser);
      this.userId = this.userResponse.id
      this.loggedIn = true;
      this.showLogin = false;

      const adminLoggedIn = localStorage.getItem('adminLoggedIn');
      if (adminLoggedIn === 'true') {
        this.AdminLoggedIn = true;
      }
    }
    else {
      this.showLogin = false;
      console.log("user not working : ",loggedInUser);
    }
  }

  
  goToAddProduct() {
this.showProdInp = !this.showProdInp;
  }

  addProduct(name: string, description: string, originalPrice: string, categoryId: string, stock: string) {
   const payload = {
    name: name,
    description: description,
    originalPrice: +originalPrice,
    categoryId: +categoryId,
    stock: +stock,
    images: this.productAddImages
   }
    this.productService.addProduct(payload).subscribe({
      next: (response) => {
        alert("product added successfully");
        this.showProdInp = false;
        console.log("product added");
      },
      error: (error) => {
        console.log("error adding product", error);
      }
    });
  }

   addImage() {
    if (this.newImage.url.trim()) {
      this.productAddImages.push({ ...this.newImage });
      this.newImage = { url: '', description: '' };
    }
  }

  removeImage(index: number) {
   this.productAddImages.splice(index, 1);
  }

  goToCart() {
    if (!this.userId) {
      alert('You must be logged in to view the cart.');

      return;
    } else {
    this.router.navigate(['/Cart']);
    }
  }

 goToUserPanel(panel?: string): void {
    if (panel) {
      // Navigate with query parameter to specify which panel to show
      this.router.navigate(['/User'], { queryParams: { panel: panel } });
    } else {
      // Default navigation without specifying panel
      this.router.navigate(['/User']);
    }
  }
  goToAdminPanel(): void {
    this.router.navigate(['/Admin']);
  }

  onSubmit(logInForm: NgForm) {
    if (logInForm.invalid) {
      this.errorMessage = "invalid credentials";
      return;
    }
    
    this.authService.logIn(this.userAuth).subscribe(
      (response) => {
        location.reload();
        console.log('Login successful', response);
        this.userResponse = response;
        this.loggedIn = true;
        if (response.role === 2) {
          this.AdminLoggedIn = true;
          // Save adminLoggedIn to localStorage
          localStorage.setItem('adminLoggedIn', 'true');
        }
        this.showLogin = false;
        this.errorMessage = '';
        this.userAuth = {
          email: '',
          password: ''
        };
        this.userId = response.id;
        // The auth service will handle emitting the login success event


        localStorage.setItem('userauthinterface', JSON.stringify(response));
      },
      (error) => {
        console.error('Login failed', this.userAuth, this.userResponse, error);
        this.errorMessage = "invalid credentials";
        console.log(error.error?.message);
      }
    );

  }

  onRegister(registerForm: NgForm) {

    if (registerForm.invalid) {
      registerForm.control.markAllAsTouched();
      this.regError = "invalid credentials"; // shows all validation messages
      return; // ⛔ 
    }

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        
       Swal.fire({  
          position: 'center',  
          icon: 'success',  
          title: `${this.registerData.firstName} registered successfully, welcome`,  
          showConfirmButton: false,  
          timer: 3000  
        });
        this.showRegister = false;
        this.registerData = {
          firstName: '',
          lastName: '',
          email: '',
          password: ''
        };
       
      },
      error: (err) => {
        console.error('Registration failed', err);
        
      } 
    });
    
 
} 

logout(): void {
  this.authService.logout();
  this.loggedIn = false;
  this.userResponse = {
    id: 0,
    email: '',
    role: 0,
    token: ''
  };
  this.showLogin = false;
  this.userId = 0;
  localStorage.removeItem('adminLoggedIn');
  this.AdminLoggedIn = false;
  this.router.navigate(['']);
  location.reload();
}

ngOnDestroy(): void {
  throw new Error('Method not implemented.');
}

}
