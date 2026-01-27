import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-register',
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full">
        <div class="card">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900">Create Account</h2>
            <p class="mt-2 text-sm text-gray-600">Register as a teacher</p>
          </div>

          @if (error()) {
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {{ error() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-6">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                id="username"
                type="text"
                [(ngModel)]="username"
                name="username"
                required
                class="input"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                class="input"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                id="password"
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                class="input"
                placeholder="Create a password"
              />
            </div>

            <button
              type="submit"
              [disabled]="loading()"
              class="btn btn-primary w-full"
            >
              @if (loading()) {
                <span class="spinner mr-2"></span>
              }
              Register
            </button>

            <p class="text-center text-sm text-gray-600">
              Already have an account?
              <a routerLink="/login" class="text-blue-600 hover:text-blue-700 font-medium">Sign in</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
    private authService = inject(AuthService);
    private router = inject(Router);

    username = '';
    email = '';
    password = '';
    loading = signal(false);
    error = signal('');

    onSubmit(): void {
        if (!this.username || !this.email || !this.password) {
            this.error.set('Please fill in all fields');
            return;
        }

        this.loading.set(true);
        this.error.set('');

        this.authService.register(this.username, this.email, this.password).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.error.set(err.error?.error || 'Registration failed. Please try again.');
                this.loading.set(false);
            }
        });
    }
}
