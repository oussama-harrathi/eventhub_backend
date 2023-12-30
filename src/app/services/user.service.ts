import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'http://localhost:3000/users';
  private isAuthenticated = new BehaviorSubject<boolean>(false);
  private loggedInWithGoogle = new BehaviorSubject<boolean>(false);
  private authToken: string | null = localStorage.getItem('authToken');
  private authChannel = new BroadcastChannel('authChannel');
  private logoutTimer: any;
  private userDetails = new BehaviorSubject<{ name: string, email: string } | null>(null);
  public userDetails$ = this.userDetails.asObservable();

  public isAuthenticated$ = this.isAuthenticated.asObservable();
  public loggedInWithGoogle$ = this.loggedInWithGoogle.asObservable();

  constructor(private http: HttpClient) {
    this.authChannel.onmessage = this.handleAuthChannelMessage;

    if (this.authToken) {
      this.updateAuthenticationStatus(true);
      this.setAutoLogout();
    }

    const googleLoginStatus = localStorage.getItem('googleLoginStatus');
    this.setLoggedInWithGoogle(googleLoginStatus === 'true');
  }

  private handleAuthChannelMessage = (message: MessageEvent) => {
    switch (message.data.action) {
      case 'login':
        this.updateAuthenticationStatus(true);
        this.authToken = message.data.token;
        this.setAutoLogout();
        break;
      case 'logout':
        this.logout();
        break;
      default:
        break;
    }
  };

  private getAuthHeaders() {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authToken}`
    });
  }

  isTokenExpired(): boolean {
    const token = this.authToken;
    if (!token) return true;

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/verify-email?token=${token}`);
  }

  updateAuthenticationStatus(status: boolean) {
    this.isAuthenticated.next(status);
  }

  setLoggedInWithGoogle(status: boolean) {
    this.loggedInWithGoogle.next(status);
  }

  registerUser(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, userData);
  }

  login(email: string, password: string): Observable<any> {
    const body = { email, password };
    return this.http.post(`${this.baseUrl}/login`, body).pipe(
      tap((response: any) => {
        if (response && response.token) {
          localStorage.setItem('authToken', response.token); // Store token in localStorage
          this.authToken = response.token;
          this.updateAuthenticationStatus(true);
          this.setLoggedInWithGoogle(false);
          this.authChannel.postMessage({ action: 'login', token: response.token });
          this.setAutoLogout(); // Call setAutoLogout only if authToken is not null
          const decodedToken = this.getDecodedToken();
        if (decodedToken) {
          this.userDetails.next({ name: decodedToken.full_name, email: decodedToken.email });
        }
          
        }
      })
    );
  }

  registerGoogleUser(userData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/google-register`, userData).pipe(
      tap((response: any) => {
        if (response && response.token) {
          localStorage.setItem('authToken', response.token); // Store token in localStorage
          localStorage.setItem('googleLoginStatus', 'true');
          this.authToken = response.token;
          this.updateAuthenticationStatus(true);
          this.setLoggedInWithGoogle(true);
          this.authChannel.postMessage({ action: 'login', token: response.token });
          this.setAutoLogout(); // Call setAutoLogout only if authToken is not null
        }
      })
    );
  }

  private setAutoLogout() {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }

    const checkTokenInterval = setInterval(() => {
      const currentToken = localStorage.getItem('authToken');
      if (currentToken !== this.authToken) {
        this.authToken = currentToken;
        this.updateAuthenticationStatus(!!currentToken);
        if (currentToken) {
          const timeLeft = this.getTokenTimeLeft(currentToken);
          if (timeLeft > 0) {
            this.scheduleLogout(timeLeft);
          }
        } else {
          if (this.logoutTimer) {
            clearTimeout(this.logoutTimer);
          }
        }
      }
    }, 1000);
  }

  private getTokenTimeLeft(token: string): number {
    const decodedToken = jwtDecode<any>(token);
    const expirationTime = decodedToken.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    return expirationTime - currentTime;
  }

  private scheduleLogout(timeLeft: number) {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
    this.logoutTimer = setTimeout(() => {
      this.logout();
    }, timeLeft);
  }

  requestResetPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/request-reset-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, { token, newPassword });
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const body = { oldPassword, newPassword };
    return this.http.post(`${this.baseUrl}/change-password`, body, { headers });
  }
  getDecodedToken() {
    // Retrieve the authToken from localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Decode the token and return the decoded object
        return jwtDecode<any>(token);
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  logout() {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('googleLoginStatus'); // Clear token from localStorage
    this.authToken = null;
    this.updateAuthenticationStatus(false);
    this.setLoggedInWithGoogle(false);
    this.authChannel.postMessage({ action: 'logout' });
    this.userDetails.next(null);
    // Clear other relevant data
  }
}
