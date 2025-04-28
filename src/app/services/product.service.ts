import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductInterface } from '../interfaces/product-interface';
import { ReviewInterface } from '../interfaces/review-interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://localhost:7219/api/Product';
  private ProductByIdApiUrl = 'https://localhost:7219/api/Product';
  private userFavProdsApiUrl = 'https://localhost:7219/api/User';
  private toggleFavoritesApiUrl = 'https://localhost:7219/api/User';
  private getProductsByCategoryApiUrl = 'https://localhost:7219/api/Product/category';
  private postReview = 'https://localhost:7219/api/Review';

  constructor(private http: HttpClient) { }


  getAllProducts(): Observable<ProductInterface[]> {
    return this.http.get<ProductInterface[]>(this.apiUrl);
  }

  getProductsByCategoryId(categoryId: number): Observable<ProductInterface[]> {
    return this.http.get<ProductInterface[]>(`${this.getProductsByCategoryApiUrl}/${categoryId}`);
  }

  getProductById(id: number): Observable<ProductInterface> {
    return this.http.get<ProductInterface>(`${this.ProductByIdApiUrl}/${id}`)
  }

  getFavorites(userId: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.userFavProdsApiUrl}/${userId}/favorites`);
  }

  toggleFavorite(userId: number, productId: number): Observable<number[]> {
    return this.http.post<number[]>(
      `${this.toggleFavoritesApiUrl}/${userId}/favorites/${productId}`,
      {}
    );
  }

  submitReview(userId: number, productId: number, review: ReviewInterface): Observable<any> {
    
    return this.http.post(`${this.postReview}/${userId}/${productId}`, review);
  }

}
