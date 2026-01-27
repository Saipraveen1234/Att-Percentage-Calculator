import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'students',
        canActivate: [authGuard],
        loadComponent: () => import('./features/students/students.component').then(m => m.StudentsComponent)
    },
    {
        path: 'classes',
        canActivate: [authGuard],
        loadComponent: () => import('./features/classes/classes.component').then(m => m.ClassesComponent)
    },
    {
        path: 'attendance',
        canActivate: [authGuard],
        loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent)
    },
    {
        path: 'reports',
        canActivate: [authGuard],
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
    },
    { path: '**', redirectTo: '/dashboard' }
];
