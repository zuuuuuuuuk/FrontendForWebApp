import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // adjust path

@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    // Check if user is logged in, adjust method as per your AuthService
    if (this.authService.isLoggedIn()) {
      return true; // allow route activation
    } else {
      this.router.navigate(['']); // redirect to login if not logged in
      return false;
    }
  }
}