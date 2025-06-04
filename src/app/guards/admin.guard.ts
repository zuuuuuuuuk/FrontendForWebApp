import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const role = this.authService.getUserRole();
    const loggedIn = !!this.authService.getToken();

    if (loggedIn && role === 'Admin') {
      return true;
    }

    this.router.navigate(['']); // redirect to home or login
    return false;
  }
}