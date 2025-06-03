import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaleInterface } from '../interfaces/sale-interface';
import { AddSaleInterface } from '../interfaces/add-sale-interface';
import { ChangeSaleInterface } from '../interfaces/change-sale-interface';

@Injectable({
  providedIn: 'root'
})
export class SaleService {

  private getAllSalesApiUrl = 'https://localhost:7219/api/Sale';
  private addSaleApiUrl = 'https://localhost:7219/api/Sale';
  private removeSaleApiUrl = 'https://localhost:7219/api/Sale/';
  private activateSaleApiUrl = 'https://localhost:7219/api/Sale/';
  private deactivateSaleApiUrl = 'https://localhost:7219/api/Sale/';
  private addProductToSaleApiUrl = 'https://localhost:7219/api/Sale/';
  private removeProductFromSaleApiUrl = 'https://localhost:7219/api/Sale/';
  private changeSaleApiUrl = 'https://localhost:7219/api/Sale/';

  constructor(private http: HttpClient) { }

  
  getAllSales(): Observable<SaleInterface[]> {
    return this.http.get<SaleInterface[]>(this.getAllSalesApiUrl);
  }

  addSale(sale: AddSaleInterface): Observable<AddSaleInterface> {
    console.log(sale);
    return this.http.post<AddSaleInterface>(this.addSaleApiUrl, sale);
  }

  removeSale(saleId: number): Observable<void> {
    return this.http.delete<void>(`${this.removeSaleApiUrl}${saleId}`, {});
  }

  activateSale(saleId: number, days: number): Observable<void> {
    return this.http.post<void>(`${this.activateSaleApiUrl}${saleId}/${days}/activate`, {});
  }

  deactivateSale(saleId: number): Observable<void> {
    return this.http.post<void>(`${this.deactivateSaleApiUrl}${saleId}/deactivate`, {})
  }

  changeSale(saleId: number , name: string, description: string, value: number): Observable<ChangeSaleInterface>{
    const payload = {
      name: name,
      discountValue: value,
      description: description
    }
    return this.http.put<ChangeSaleInterface>(`${this.changeSaleApiUrl}${saleId}`, payload)
  }

  addProductToSale(saleId: number , productId: number[]): Observable<number[]> {
    return this.http.put<number[]>(`${this.addProductToSaleApiUrl}${saleId}/add-products`, productId);
  }

  removeProductFromSale(saleId: number, productId: number[]): Observable<number[]>{
    return this.http.put<number[]>(`${this.removeProductFromSaleApiUrl}${saleId}/remove-products`, productId);
  }

}
