import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { UserAuth } from '../interfaces/Auth-interfaces/userAuth';
import { LoginResponse } from '../interfaces/Auth-interfaces/login-response';
import { RegisterRequest } from '../interfaces/Auth-interfaces/register-request';
import { BehaviorSubject } from 'rxjs';
import { Token } from '@angular/compiler';
import { GetUserInterface } from '../interfaces/get-user-interface';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = 'https://localhost:7219/api/Auth/login';
  private registerUrl = 'https://localhost:7219/api/Auth/register';
  private getAllUsersApiUrl = 'https://localhost:7219/api/User';
  private deleteUserApiUrl = 'https://localhost:7219/api/User/';
  private getUserByIdApiUrl = 'https://localhost:7219/api/User/';

  private userId: number = 0;
  private email: string = '';
  public role: string = '';

  private loggedInSubject = new BehaviorSubject<boolean>(false);
  loggedIn$ = this.loggedInSubject.asObservable();

  public loginSuccess = new EventEmitter<void>();
  userRole$: any;

  constructor(private http: HttpClient) {
    this.loadUserFromToken();
  }


  logIn(userAuth: UserAuth): Observable<LoginResponse> {
    const loginModel = {
      email: userAuth.email,
      password: userAuth.password
    };
    
    return this.http.post<LoginResponse>(this.apiUrl, loginModel).pipe(
      tap(response => {
        localStorage.setItem('token', response.token)
        localStorage.setItem('userauthinterface', JSON.stringify(response));
        this.loadUserFromToken(); // Ensure user data is loaded
        this.loggedInSubject.next(true);
        this.loginSuccess.emit(); // Emit success event
      })
    );
  }
 
  logout(): void {
    localStorage.removeItem('userauthinterface');
    this.userId = 0; // Reset user ID to 0
    this.email = '';
    this.role = '';
     localStorage.removeItem('token');
      // Ensure user data is loaded
        this.loggedInSubject.next(false);
      
  
  }
  

    getAllUsers(): Observable<GetUserInterface[]> {
      return this.http.get<GetUserInterface[]>(this.getAllUsersApiUrl);
    }

    getUserById(userId: number): Observable<GetUserInterface> {
      return this.http.get<GetUserInterface>(`${this.getUserByIdApiUrl}${userId}`);
    }

    deleteUser(userId:number): Observable<void> {
      return this.http.delete<void>(`${this.deleteUserApiUrl}${userId}`);
    }

    register(data: RegisterRequest): Observable<any> {
      return this.http.post(`${this.registerUrl}`, data);
    }


    private getAuthHeaders(): HttpHeaders {
      const token = this.getToken();
      if (token) {
        return new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
      }
      return new HttpHeaders(); // Return empty headers if no token
    }

    getProtectedResource(): Observable<any> {
      const headers = this.getAuthHeaders();
      return this.http.get('https://localhost:7219/api/protected', { headers });
    }

    getToken(): string | null {
      const userAuthString = localStorage.getItem('userauthinterface');
      if (!userAuthString) {
        return null;
      }
      const userAuth = JSON.parse(userAuthString);
      return userAuth.token || null;
    }
    
    private loadUserFromToken(): void {
      const userAuthString = localStorage.getItem('userauthinterface');
      if (!userAuthString) {
        console.log("Token container missing from localStorage");
        return;
      }
      
      try {
        const userAuth = JSON.parse(userAuthString);
        this.userId = userAuth.id; // Set ID directly from response if available
        
        const token = userAuth.token;
        if (!token) {
          console.log("Token is missing inside userauthinterface");
          return;
        }
        
        console.log("Extracted token:", token);
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("Decoded payload:", payload);
        
        // Use ID from token if not available directly
        if (!this.userId && payload.nameid) {
          this.userId = parseInt(payload.nameid);
        }
        
        this.email = payload.email;
        this.role = payload.role;
        
        console.log("User ID:", this.userId, "Email:", this.email, "Role:", this.role);
      } catch (e) {
        console.error('Failed to parse token from localStorage', e);
      }
    }
  
    getUserId(): number {
      return this.userId;
    }
  
    getUserEmail(): string {
      return this.email;
    }
  
    getUserRole(): string {
      return this.role;
    }
  }
  

