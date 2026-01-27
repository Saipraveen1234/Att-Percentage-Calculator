import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassService, Class } from '../../core/services/class.service';
import { StudentService, Student } from '../../core/services/student.service';
import { AttendanceService, AttendanceRecord } from '../../core/services/attendance.service';

interface DateColumn {
  date: string;
  dayOfWeek: string;
  dayOfMonth: string;
}

@Component({
  selector: 'app-attendance',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Daily Attendance</h1>
          <p class="text-gray-600 mt-1">BSM / BSM-2 / Semester 3 / B</p>
        </div>
        <div class="flex gap-3">
          <input
            type="date"
            [(ngModel)]="selectedDate"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select [(ngModel)]="selectedClassId" (change)="loadStudents()" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            <option [value]="null">Select a class</option>
            @for (class of classes(); track class.id) {
              <option [value]="class.id">{{ class.name }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Attendance Table -->
      @if (selectedClassId) {
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          @if (loading()) {
            <div class="flex justify-center py-12">
              <div class="spinner"></div>
            </div>
          } @else if (students().length === 0) {
            <div class="text-center py-12 text-gray-500">
              <p class="text-lg">No students in this class</p>
            </div>
          } @else {
            <!-- Table Header -->
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                      Student Name
                    </th>
                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    @for (dateCol of dateColumns(); track dateCol.date) {
                      <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">
                        <div>{{ dateCol.dayOfWeek }}</div>
                        <div class="text-lg font-bold text-gray-900">{{ dateCol.dayOfMonth }}</div>
                      </th>
                    }
                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  @for (student of students(); track student.id; let idx = $index) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                        <div>
                          <div class="text-sm font-medium text-gray-900">{{ student.name }}</div>
                          <div class="text-xs text-gray-500">{{ student.rollNumber }}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-center">
                        @if (getAttendanceStatus(student.id) === 'present') {
                          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-status-present/10 text-status-present">
                            Present
                          </span>
                        } @else if (getAttendanceStatus(student.id) === 'absent') {
                          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-status-absent/10 text-status-absent">
                            Absent
                          </span>
                        } @else if (getAttendanceStatus(student.id) === 'late') {
                          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-status-late/10 text-status-late">
                            Late
                          </span>
                        }
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-center">
                        <div class="flex gap-1 justify-center">
                          <button
                            (click)="setAttendance(student.id, 'present')"
                            [class.bg-status-present]="getAttendanceStatus(student.id) === 'present'"
                            [class.text-white]="getAttendanceStatus(student.id) === 'present'"
                            [class.bg-gray-100]="getAttendanceStatus(student.id) !== 'present'"
                            [class.text-gray-700]="getAttendanceStatus(student.id) !== 'present'"
                            class="px-3 py-1 rounded text-xs font-medium hover:opacity-80 transition-opacity"
                            title="Mark Present"
                          >
                            P
                          </button>
                          <button
                            (click)="setAttendance(student.id, 'absent')"
                            [class.bg-status-absent]="getAttendanceStatus(student.id) === 'absent'"
                            [class.text-white]="getAttendanceStatus(student.id) === 'absent'"
                            [class.bg-gray-100]="getAttendanceStatus(student.id) !== 'absent'"
                            [class.text-gray-700]="getAttendanceStatus(student.id) !== 'absent'"
                            class="px-3 py-1 rounded text-xs font-medium hover:opacity-80 transition-opacity"
                            title="Mark Absent"
                          >
                            A
                          </button>
                          <button
                            (click)="setAttendance(student.id, 'late')"
                            [class.bg-status-late]="getAttendanceStatus(student.id) === 'late'"
                            [class.text-white]="getAttendanceStatus(student.id) === 'late'"
                            [class.bg-gray-100]="getAttendanceStatus(student.id) !== 'late'"
                            [class.text-gray-700]="getAttendanceStatus(student.id) !== 'late'"
                            class="px-3 py-1 rounded text-xs font-medium hover:opacity-80 transition-opacity"
                            title="Mark Late"
                          >
                            L
                          </button>
                        </div>
                      </td>
                      @for (dateCol of dateColumns(); track dateCol.date) {
                        <td class="px-4 py-4 text-center">
                          <span class="text-sm text-gray-400">-</span>
                        </td>
                      }
                      <td class="px-6 py-4 text-center">
                        <span class="text-sm font-medium text-gray-900">{{ idx + 1 }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Action Buttons -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <div class="flex gap-2">
                <button (click)="markAll('present')" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Mark All Present
                </button>
                <button (click)="markAll('absent')" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Mark All Absent
                </button>
              </div>
              <button
                (click)="submitAttendance()"
                [disabled]="saving()"
                class="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (saving()) {
                  <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                }
                Save Attendance
              </button>
            </div>
          }
        </div>
      }

      @if (successMessage()) {
        <div class="fixed bottom-4 right-4 bg-status-present text-white px-6 py-3 rounded-lg shadow-lg">
          {{ successMessage() }}
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class AttendanceComponent implements OnInit {
  private classService = inject(ClassService);
  private studentService = inject(StudentService);
  private attendanceService = inject(AttendanceService);

  classes = signal<Class[]>([]);
  students = signal<Student[]>([]);
  dateColumns = signal<DateColumn[]>([]);
  loading = signal(false);
  saving = signal(false);
  successMessage = signal('');

  selectedDate = new Date().toISOString().split('T')[0];
  selectedClassId: number | null = null;
  attendanceMap = new Map<number, 'present' | 'absent' | 'late' | 'excused'>();

  ngOnInit(): void {
    this.loadClasses();
    this.generateDateColumns();
  }

  generateDateColumns(): void {
    const dates: DateColumn[] = [];
    const today = new Date();

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      dates.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: dayNames[date.getDay()],
        dayOfMonth: date.getDate().toString()
      });
    }

    this.dateColumns.set(dates);
  }

  loadClasses(): void {
    this.classService.getAll().subscribe({
      next: (classes) => this.classes.set(classes)
    });
  }

  loadStudents(): void {
    if (!this.selectedClassId) return;

    this.loading.set(true);
    this.studentService.getAll({ classId: this.selectedClassId }).subscribe({
      next: (response) => {
        this.students.set(response.students);
        this.attendanceMap.clear();
        response.students.forEach(s => this.attendanceMap.set(s.id, 'present'));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setAttendance(studentId: number, status: 'present' | 'absent' | 'late' | 'excused'): void {
    this.attendanceMap.set(studentId, status);
  }

  getAttendanceStatus(studentId: number): string {
    return this.attendanceMap.get(studentId) || 'present';
  }

  markAll(status: 'present' | 'absent'): void {
    this.students().forEach(s => this.attendanceMap.set(s.id, status));
  }

  submitAttendance(): void {
    if (!this.selectedClassId) return;

    const records: AttendanceRecord[] = Array.from(this.attendanceMap.entries()).map(([studentId, status]) => ({
      studentId,
      status
    }));

    this.saving.set(true);
    this.attendanceService.markAttendance(this.selectedClassId, this.selectedDate, records).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMessage.set('Attendance saved successfully!');
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => {
        this.saving.set(false);
        alert('Failed to save attendance');
      }
    });
  }
}
