import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    @if (authService.isAuthenticated()) {
      <div class="min-h-screen bg-gray-50">
        <!-- Sidebar -->
        <div class="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
          <div class="flex flex-col h-full">
            <!-- Logo -->
            <div class="flex items-center justify-center h-16 bg-blue-600">
              <h1 class="text-xl font-bold text-white">Attendance Tracker</h1>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 px-4 py-6 space-y-2">
              <a
                routerLink="/dashboard"
                routerLinkActive="bg-blue-50 text-blue-600"
                class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span class="text-lg mr-3">📊</span>
                <span class="font-medium">Dashboard</span>
              </a>

              <a
                routerLink="/students"
                routerLinkActive="bg-blue-50 text-blue-600"
                class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span class="text-lg mr-3">👥</span>
                <span class="font-medium">Students</span>
              </a>

              <a
                routerLink="/classes"
                routerLinkActive="bg-blue-50 text-blue-600"
                class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span class="text-lg mr-3">📚</span>
                <span class="font-medium">Classes</span>
              </a>

              <a
                routerLink="/attendance"
                routerLinkActive="bg-blue-50 text-blue-600"
                class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span class="text-lg mr-3">✅</span>
                <span class="font-medium">Attendance</span>
              </a>

              <a
                routerLink="/reports"
                routerLinkActive="bg-blue-50 text-blue-600"
                class="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span class="text-lg mr-3">📈</span>
                <span class="font-medium">Reports</span>
              </a>
            </nav>

            <!-- User section -->
            <div class="p-4 border-t border-gray-200">
              @if (currentUser$ | async; as user) {
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ user.username }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
                  </div>
                  <button
                    (click)="logout()"
                    class="ml-2 text-gray-400 hover:text-gray-600"
                    title="Logout"
                  >
                    <span class="text-lg">🚪</span>
                  </button>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Main content -->
        <div class="ml-64">
          <main class="p-8">
            <router-outlet></router-outlet>
          </main>
        </div>
      </div>
    } @else {
      <router-outlet></router-outlet>
    }
  `
})
export class App {
  authService = inject(AuthService);
  private router = inject(Router);

  currentUser$ = this.authService.currentUser$;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
