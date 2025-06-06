import { Injectable } from '@angular/core';
import { Subject, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductInterface } from '../interfaces/product-interface';
import { ReviewInterface } from '../interfaces/review-interface';
import { UpdateProductInterface } from '../interfaces/update-product-interface';
import { AddProductInterface } from '../interfaces/add-product-interface';
import { GettingReviewInterface } from '../interfaces/getting-review-interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://localhost:7219/api/Product';
  private addProductApiUrl = 'https://localhost:7219/api/Product';
  private ProductByIdApiUrl = 'https://localhost:7219/api/Product';
  private userFavProdsApiUrl = 'https://localhost:7219/api/User';
  private toggleFavoritesApiUrl = 'https://localhost:7219/api/User';
  private getProductsByCategoryApiUrl = 'https://localhost:7219/api/Product/category';
  private postReview = 'https://localhost:7219/api/Review';
  private updateProductApiUrl = 'https://localhost:7219/api/Product';
  private removeProductApiUrl = 'https://localhost:7219/api/Product/';
  private getReviewsByProductIdApiUrl = 'https://localhost:7219/api/Review/product/';
  private removeReviewByIdApiUrl = 'https://localhost:7219/api/Review/';


  private productAddedSource = new Subject<void>();
  productAdded$ = this.productAddedSource.asObservable();

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

  updateProductById(id: number, updatedProduct: UpdateProductInterface):Observable<UpdateProductInterface> {
  
    return this.http.put<UpdateProductInterface>(`${this.updateProductApiUrl}/${id}`, updatedProduct)
  }

  addProduct(product: AddProductInterface): Observable<AddProductInterface>{

    return this.http.post<AddProductInterface>(`${this.addProductApiUrl}`, product).pipe(
      tap(() => this.productAddedSource.next())
    );
  }

  removeProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.removeProductApiUrl}${productId}`);
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

  getReviewsByProductId(productId: number): Observable<GettingReviewInterface[]>{
    return this.http.get<GettingReviewInterface[]>(`${this.getReviewsByProductIdApiUrl}${productId}`);
  }

  removeReviewbyId(reviewId: number): Observable<void>{
    return this.http.delete<void>(`${this.removeReviewByIdApiUrl}${reviewId}`);
  }

}
