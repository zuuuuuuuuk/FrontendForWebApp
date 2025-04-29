import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CartComponent } from './cart/cart.component';
import { SalesComponent } from './sales/sales.component';
import { AdminInterfaceComponent } from './admin-interface/admin-interface.component';
import { UserInterfaceComponent } from './user-interface/user-interface.component';

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
  },
  {
    path: 'User',
    component: UserInterfaceComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
