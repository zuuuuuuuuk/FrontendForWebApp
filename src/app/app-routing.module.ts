import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CartComponent } from './cart/cart.component';
import { SalesComponent } from './sales/sales.component';
import { AdminInterfaceComponent } from './admin-interface/admin-interface.component';
import { UserInterfaceComponent } from './user-interface/user-interface.component';
import { FavoritesComponent } from './favorites/favorites.component';
import { AboutComponent } from './about/about.component';
import { AdminGuard } from './guards/admin.guard';
import { UserGuard } from './guards/user.guard';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'Cart',
    component: CartComponent,
  },
  {
    path: 'Sales',
    component: SalesComponent,
  },
  {
    path: 'Admin',
    component: AdminInterfaceComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'User',
    component: UserInterfaceComponent,
    canActivate: [UserGuard]
  },
  {
path: 'Favorites',
    component: FavoritesComponent,
  },
  {
  path: 'About',
  component: AboutComponent,  
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
