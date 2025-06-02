import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaleInterface } from '../interfaces/sale-interface';

@Injectable({
  providedIn: 'root'
})
export class SaleService {

  private getAllSalesApiUrl = 'https://localhost:7219/api/Sale';


  constructor(private http: HttpClient) { }

  
  getAllSales(): Observable<SaleInterface[]> {
    return this.http.get<SaleInterface[]>(this.getAllSalesApiUrl);
  }


}
