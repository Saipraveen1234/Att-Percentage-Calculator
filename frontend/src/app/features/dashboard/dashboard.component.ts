import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassService, Class } from '../../core/services/class.service';
import { StudentService } from '../../core/services/student.service';
import { AttendanceService } from '../../core/services/attendance.service';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule],
    template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-1">Overview of your attendance tracking</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm">Total Classes</p>
              <p class="text-3xl font-bold mt-1">{{ stats().totalClasses }}</p>
            </div>
            <span class="text-5xl opacity-50">📚</span>
          </div>
        </div>

        <div class="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm">Total Students</p>
              <p class="text-3xl font-bold mt-1">{{ stats().totalStudents }}</p>
            </div>
            <span class="text-5xl opacity-50">👥</span>
          </div>
        </div>

        <div class="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm">Today's Attendance</p>
              <p class="text-3xl font-bold mt-1">{{ stats().todayAttendance }}</p>
            </div>
            <span class="text-5xl opacity-50">✅</span>
          </div>
        </div>
      </div>

      <!-- Classes List -->
      <div class="card">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Your Classes</h2>
        
        @if (loading()) {
          <div class="flex justify-center py-8">
            <div class="spinner"></div>
          </div>
        } @else if (classes().length === 0) {
          <div class="text-center py-8 text-gray-500">
            <p class="text-lg">No classes yet</p>
            <p class="text-sm mt-2">Create a class to get started</p>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (class of classes(); track class.id) {
              <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 class="font-semibold text-gray-900">{{ class.name }}</h3>
                @if (class.subject) {
                  <p class="text-sm text-gray-600 mt-1">{{ class.subject }}</p>
                }
                @if (class.academicYear) {
                  <p class="text-xs text-gray-500 mt-2">{{ class.academicYear }}</p>
                }
                <div class="mt-3 flex items-center text-sm text-gray-600">
                  <span class="mr-2">👥</span>
                  <span>Students</span>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/students" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span class="text-2xl mr-3">👥</span>
            <div>
              <p class="font-medium text-gray-900">Manage Students</p>
              <p class="text-sm text-gray-600">Add or import students</p>
            </div>
          </a>
          <a href="/attendance" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span class="text-2xl mr-3">✅</span>
            <div>
              <p class="font-medium text-gray-900">Mark Attendance</p>
              <p class="text-sm text-gray-600">Take today's attendance</p>
            </div>
          </a>
          <a href="/reports" class="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <span class="text-2xl mr-3">📈</span>
            <div>
              <p class="font-medium text-gray-900">View Reports</p>
              <p class="text-sm text-gray-600">Attendance statistics</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
    private classService = inject(ClassService);
    private studentService = inject(StudentService);
    private attendanceService = inject(AttendanceService);

    classes = signal<Class[]>([]);
    loading = signal(true);
    stats = signal({
        totalClasses: 0,
        totalStudents: 0,
        todayAttendance: 0
    });

    ngOnInit(): void {
        this.loadData();
    }

    private loadData(): void {
        this.classService.getAll().subscribe({
            next: (classes) => {
                this.classes.set(classes);
                this.stats.update(s => ({ ...s, totalClasses: classes.length }));
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });

        this.studentService.getAll().subscribe({
            next: (response) => {
                this.stats.update(s => ({ ...s, totalStudents: response.pagination.total }));
            }
        });

        const today = new Date().toISOString().split('T')[0];
        this.attendanceService.getByDate(today).subscribe({
            next: (attendance) => {
                this.stats.update(s => ({ ...s, todayAttendance: attendance.length }));
            }
        });
    }
}
