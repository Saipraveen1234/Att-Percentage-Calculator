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
  group?: string;
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

interface StudentGroup {
  name: string;  // group name, e.g. "Biotechnology" or "" for ungrouped
  students: Student[];
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

        <!-- Quick Entry Panel -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <h2 class="text-base font-semibold text-blue-800">Quick Entry — Mark Present by Roll Number</h2>
          </div>
          <p class="text-sm text-blue-600 mb-3">
            Type roll numbers of <strong>present</strong> students. Separate by comma, space, or new line. All others will be marked <strong>Absent</strong>.
          </p>
          <textarea
            [(ngModel)]="quickEntryText"
            placeholder="e.g. 21A91A0501, 21A91A0502&#10;21A91A0503"
            rows="3"
            class="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
          ></textarea>

          <div class="flex items-center gap-3 mt-3">
            <button
              (click)="applyQuickEntry()"
              class="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Apply
            </button>
            <button
              (click)="clearQuickEntry()"
              class="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              Clear
            </button>
          </div>

          @if (quickEntryApplied()) {
            <div class="mt-3 space-y-2">
              <div class="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span><strong>{{ matchedCount() }}</strong> student(s) marked Present, <strong>{{ students().length - matchedCount() }}</strong> marked Absent</span>
              </div>
              @if (unmatchedRolls().length > 0) {
                <div class="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  </svg>
                  <span><strong>{{ unmatchedRolls().length }}</strong> roll number(s) not found: <span class="font-mono">{{ unmatchedRolls().join(', ') }}</span></span>
                </div>
              }
            </div>
          }
        </div>

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

        <!-- Students List — grouped by branch -->
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            Students ({{ students().length }})
            @if (isCombinedClass()) {
              <span class="ml-2 text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                Combined Class · {{ studentGroups().length }} groups
              </span>
            }
          </h2>

          @for (group of studentGroups(); track group.name) {
            <!-- Group Section Header (only shown for combined classes) -->
            @if (isCombinedClass()) {
              <div class="flex items-center gap-3 my-4">
                <div class="flex-1 h-px bg-gray-200"></div>
                <span class="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {{ group.name }} ({{ group.students.length }})
                </span>
                <div class="flex-1 h-px bg-gray-200"></div>
              </div>
            }

            <div class="space-y-3 mb-2">
              @for (student of group.students; track student.id) {
                <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                     [class.border-green-300]="getStatus(student.id) === 'present'"
                     [class.bg-green-50]="getStatus(student.id) === 'present'"
                     [class.border-red-300]="getStatus(student.id) === 'absent'"
                     [class.bg-red-50]="getStatus(student.id) === 'absent'"
                     [class.border-yellow-300]="getStatus(student.id) === 'late'"
                     [class.bg-yellow-50]="getStatus(student.id) === 'late'">
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
          }

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

  // Quick Entry state
  quickEntryText: string = '';
  quickEntryApplied = signal(false);
  matchedCount = signal(0);
  unmatchedRolls = signal<string[]>([]);

  // Computed: whether this is a combined class (has students with group set)
  isCombinedClass = computed(() =>
    this.students().some(s => s.group && s.group.trim() !== '')
  );

  // Computed: students grouped by their group field, sorted alphabetically by group name
  studentGroups = computed<StudentGroup[]>(() => {
    const groupMap = new Map<string, Student[]>();

    this.students().forEach(student => {
      const key = student.group?.trim() || '';
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(student);
    });

    // Sort groups alphabetically; ungrouped ('') goes last
    const sorted = Array.from(groupMap.entries()).sort(([a], [b]) => {
      if (a === '') return 1;
      if (b === '') return -1;
      return a.localeCompare(b);
    });

    return sorted.map(([name, students]) => ({
      name: name || 'General',
      students
    }));
  });

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
    this.quickEntryApplied.set(false);
    this.quickEntryText = '';
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

  applyQuickEntry() {
    if (!this.quickEntryText.trim()) return;

    const enteredRolls = this.quickEntryText
      .split(/[\n,\s]+/)
      .map(r => r.trim().toUpperCase())
      .filter(r => r.length > 0);

    if (enteredRolls.length === 0) return;

    const studentRollMap = new Map<string, number>();
    this.students().forEach(s => {
      studentRollMap.set(s.rollNumber.toUpperCase(), s.id);
    });

    let matched = 0;
    const unmatched: string[] = [];

    this.students().forEach(student => {
      if (enteredRolls.includes(student.rollNumber.toUpperCase())) {
        this.attendanceMap.set(student.id, 'present');
        matched++;
      } else {
        this.attendanceMap.set(student.id, 'absent');
      }
    });

    enteredRolls.forEach(roll => {
      if (!studentRollMap.has(roll)) unmatched.push(roll);
    });

    this.matchedCount.set(matched);
    this.unmatchedRolls.set(unmatched);
    this.quickEntryApplied.set(true);
  }

  clearQuickEntry() {
    this.quickEntryText = '';
    this.quickEntryApplied.set(false);
    this.matchedCount.set(0);
    this.unmatchedRolls.set([]);
    this.attendanceMap.clear();
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
    this.quickEntryApplied.set(false);
  }

  markAllAbsent() {
    this.students().forEach(student => {
      this.attendanceMap.set(student.id, 'absent');
    });
    this.quickEntryApplied.set(false);
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
        this.quickEntryApplied.set(false);
        this.quickEntryText = '';
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
