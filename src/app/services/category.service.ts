import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryInterface } from '../interfaces/category-interface';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private apiUrl = 'https://localhost:7219/api/Category';
  private addCategoryApiUrl = 'https://localhost:7219/api/Category';

  constructor(private http: HttpClient) { }


  getCategories(): Observable<CategoryInterface[]> {
    return this.http.get<CategoryInterface[]>(this.apiUrl);
  }

  addCategory(category: CategoryInterface): Observable<CategoryInterface> {
   return this.http.post<CategoryInterface>(this.addCategoryApiUrl, category);
  }

  removeCategory(categoryId: number): Observable<void> {
    return this.http.delete<void>(`https://localhost:7219/api/Category/${categoryId}`);
  }

}
