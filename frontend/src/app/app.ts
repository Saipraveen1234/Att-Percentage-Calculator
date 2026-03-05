import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    @if (authService.isAuthenticated()) {
      <div class="min-h-screen bg-[#F8FAFC]">
        <!-- Top Navigation -->
        <header class="bg-[#1B2028] text-white shadow-md sticky top-0 z-50">
          <div class="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
            
            <!-- Left: Logo & Navigation -->
            <div class="flex items-center gap-12">
              <!-- Logo -->
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 bg-[#10B981] rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
                  A
                </div>
                <h1 class="text-xl font-bold tracking-tight">Attenad</h1>
              </div>

              <!-- Navigation Links -->
              <nav class="hidden md:flex flex-row items-center gap-6 h-16">
                <a
                  routerLink="/dashboard"
                  routerLinkActive="text-[#10B981] border-b-2 border-[#10B981] opacity-100 font-medium"
                  class="h-full flex items-center text-sm text-gray-300 hover:text-white opacity-80 transition-all border-b-2 border-transparent"
                >
                  Overview
                </a>
                <a
                  routerLink="/attendance"
                  routerLinkActive="text-[#10B981] border-b-2 border-[#10B981] opacity-100 font-medium"
                  class="h-full flex items-center text-sm text-gray-300 hover:text-white opacity-80 transition-all border-b-2 border-transparent"
                >
                  Manage Attendance
                </a>
                <a
                  routerLink="/students"
                  routerLinkActive="text-[#10B981] border-b-2 border-[#10B981] opacity-100 font-medium"
                  class="h-full flex items-center text-sm text-gray-300 hover:text-white opacity-80 transition-all border-b-2 border-transparent"
                >
                  Student's List
                </a>
                <a
                  routerLink="/classes"
                  routerLinkActive="text-[#10B981] border-b-2 border-[#10B981] opacity-100 font-medium"
                  class="h-full flex items-center text-sm text-gray-300 hover:text-white opacity-80 transition-all border-b-2 border-transparent"
                >
                  Classes
                </a>
                <a
                  routerLink="/exam-marks"
                  routerLinkActive="text-[#10B981] border-b-2 border-[#10B981] opacity-100 font-medium"
                  class="h-full flex items-center text-sm text-gray-300 hover:text-white opacity-80 transition-all border-b-2 border-transparent"
                >
                  Exam Marks
                </a>
                <a
                  routerLink="/reports"
                  routerLinkActive="text-[#10B981] border-b-2 border-[#10B981] opacity-100 font-medium"
                  class="h-full flex items-center text-sm text-gray-300 hover:text-white opacity-80 transition-all border-b-2 border-transparent"
                >
                  Reports
                </a>
              </nav>
            </div>

            <!-- Right: Search, Actions, Profile -->
            <div class="flex items-center gap-6">
              <!-- Search Bar Dummy -->
              <div class="relative hidden lg:block w-64">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  class="block w-full pl-10 pr-3 py-1.5 border border-transparent rounded-md leading-5 bg-[#2B323D] text-gray-300 placeholder-gray-500 focus:outline-none focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 sm:text-sm transition-colors"
                >
              </div>

              <!-- Action Icons -->
              <div class="flex items-center gap-4 text-gray-400">
                <button class="hover:text-white transition">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                <div class="h-4 w-px bg-gray-600 hidden sm:block"></div>
                <!-- Profile Dropdown Trigger (Logout added here for now) -->
                @if (currentUser$ | async; as user) {
                  <div class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition" (click)="logout()" title="Click to logout">
                    <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shadow-inner">
                      {{ user.username.charAt(0) | uppercase }}
                    </div>
                    <div class="hidden sm:flex items-center gap-1 group">
                      <span class="text-sm font-medium text-gray-200 group-hover:text-white">{{ user.username }}</span>
                      <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </header>

        <!-- Main Content Viewport -->
        <main class="max-w-[1600px] mx-auto p-4 md:p-8">
          <router-outlet></router-outlet>
        </main>
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
