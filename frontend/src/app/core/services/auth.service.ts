import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
}

export interface AuthResponse {
    token: string;
    user: User;
    message: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor() {
        // Check if user is already logged in
        const token = this.getToken();
        if (token) {
            this.loadCurrentUser();
        }
    }

    register(username: string, email: string, password: string, role: string = 'teacher'): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, {
            username,
            email,
            password,
            role
        }).pipe(
            tap(response => {
                this.setToken(response.token);
                this.currentUserSubject.next(response.user);
            })
        );
    }

    login(username: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
            username,
            password
        }).pipe(
            tap(response => {
                this.setToken(response.token);
                this.currentUserSubject.next(response.user);
            })
        );
    }

    logout(): void {
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    setToken(token: string): void {
        localStorage.setItem('token', token);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    private loadCurrentUser(): void {
        this.http.get<User>(`${environment.apiUrl}/auth/me`).subscribe({
            next: (user) => this.currentUserSubject.next(user),
            error: (err) => {
                // Only logout if the token is invalid or expired (401/403)
                if (err.status === 401 || err.status === 403) {
                    this.logout();
                }
                console.error('Failed to load user:', err);
            }
        });
    }
}
