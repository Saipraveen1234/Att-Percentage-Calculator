import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Student {
  id: number;
  rollNumber: string;
  name: string;
  email?: string;
}

interface Class {
  id: number;
  name: string;
  subject?: string;
}

interface AttendanceRecord {
  studentId: number;
  status: 'present' | 'absent' | 'late';
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Mark Attendance</h1>
        <p class="text-gray-600 mt-2">Record student attendance for the day</p>
      </div>

      <!-- Date and Class Selection -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              [(ngModel)]="selectedDate"
              (change)="loadStudents()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              [(ngModel)]="selectedClassId"
              (change)="loadStudents()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a class</option>
              @for (class of classes; track class.id) {
                <option [value]="class.id">{{ class.name }}</option>
              }
            </select>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p class="mt-4 text-gray-600">Loading students...</p>
        </div>
      } @else if (students().length > 0) {
        <!-- Bulk Actions -->
        <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div class="flex gap-3">
            <button
              (click)="markAllPresent()"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Mark All Present
            </button>
            <button
              (click)="markAllAbsent()"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        <!-- Students List -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Students ({{ students().length }})</h2>
          
          <div class="space-y-3">
            @for (student of students(); track student.id; let idx = $index) {
              <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900">{{ student.name }}</h3>
                  <p class="text-sm text-gray-500">Roll No: {{ student.rollNumber }}</p>
                </div>
                
                <div class="flex gap-2">
                  <button
                    (click)="setAttendance(student.id, 'present')"
                    [class.bg-green-600]="getStatus(student.id) === 'present'"
                    [class.text-white]="getStatus(student.id) === 'present'"
                    [class.bg-gray-100]="getStatus(student.id) !== 'present'"
                    [class.text-gray-700]="getStatus(student.id) !== 'present'"
                    class="px-4 py-2 rounded-lg font-medium transition hover:opacity-80"
                  >
                    ✓ Present
                  </button>
                  <button
                    (click)="setAttendance(student.id, 'absent')"
                    [class.bg-red-600]="getStatus(student.id) === 'absent'"
                    [class.text-white]="getStatus(student.id) === 'absent'"
                    [class.bg-gray-100]="getStatus(student.id) !== 'absent'"
                    [class.text-gray-700]="getStatus(student.id) !== 'absent'"
                    class="px-4 py-2 rounded-lg font-medium transition hover:opacity-80"
                  >
                    ✕ Absent
                  </button>
                  <button
                    (click)="setAttendance(student.id, 'late')"
                    [class.bg-yellow-600]="getStatus(student.id) === 'late'"
                    [class.text-white]="getStatus(student.id) === 'late'"
                    [class.bg-gray-100]="getStatus(student.id) !== 'late'"
                    [class.text-gray-700]="getStatus(student.id) !== 'late'"
                    class="px-4 py-2 rounded-lg font-medium transition hover:opacity-80"
                  >
                    ⏰ Late
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Save Button -->
          <div class="mt-6 flex justify-end">
            <button
              (click)="saveAttendance()"
              [disabled]="saving()"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (saving()) {
                <span class="flex items-center gap-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </span>
              } @else {
                Save Attendance
              }
            </button>
          </div>
        </div>
      } @else {
        <div class="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900">No students found</h3>
          <p class="mt-2 text-gray-500">Select a class and date to view students</p>
        </div>
      }
    </div>
  `
})
export class AttendanceComponent implements OnInit {
  students = signal<Student[]>([]);
  classes: Class[] = [];
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedClassId: string = '';
  attendanceMap = new Map<number, 'present' | 'absent' | 'late'>();
  loading = signal(false);
  saving = signal(false);

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.loadClasses();
  }

  loadClasses() {
    this.http.get<Class[]>(`${environment.apiUrl}/classes`).subscribe({
      next: (classes) => {
        this.classes = classes;
        if (classes.length > 0 && !this.selectedClassId) {
          this.selectedClassId = classes[0].id.toString();
          this.loadStudents();
        }
      },
      error: (error) => {
        console.error('Failed to load classes:', error);
        alert('Failed to load classes');
      }
    });
  }

  loadStudents() {
    if (!this.selectedClassId) {
      this.students.set([]);
      return;
    }

    this.loading.set(true);
    this.http.get<{ students: Student[] }>(`${environment.apiUrl}/students?classId=${this.selectedClassId}`)
      .subscribe({
        next: (response) => {
          this.students.set(response.students);
          this.attendanceMap.clear();
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to load students:', error);
          alert('Failed to load students');
          this.loading.set(false);
        }
      });
  }

  setAttendance(studentId: number, status: 'present' | 'absent' | 'late') {
    this.attendanceMap.set(studentId, status);
  }

  getStatus(studentId: number): 'present' | 'absent' | 'late' | undefined {
    return this.attendanceMap.get(studentId);
  }

  markAllPresent() {
    this.students().forEach(student => {
      this.attendanceMap.set(student.id, 'present');
    });
  }

  markAllAbsent() {
    this.students().forEach(student => {
      this.attendanceMap.set(student.id, 'absent');
    });
  }

  saveAttendance() {
    if (this.attendanceMap.size === 0) {
      alert('Please mark attendance for at least one student');
      return;
    }

    const records: AttendanceRecord[] = Array.from(this.attendanceMap.entries()).map(
      ([studentId, status]) => ({ studentId, status })
    );

    this.saving.set(true);
    this.http.post(`${environment.apiUrl}/attendance`, {
      date: this.selectedDate,
      classId: Number(this.selectedClassId),
      records
    }).subscribe({
      next: () => {
        alert('Attendance saved successfully!');
        this.attendanceMap.clear();
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Failed to save attendance:', error);
        alert('Failed to save attendance');
        this.saving.set(false);
      }
    });
  }
}
