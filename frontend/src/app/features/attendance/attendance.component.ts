import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
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
  name: string;
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              [ngModel]="selectedClassId"
              (ngModelChange)="onClassChange($event)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a class</option>
              @for (class of classes; track class.id) {
                <option [value]="class.id">{{ class.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Group</label>
            <select
              [ngModel]="selectedGroup()"
              (ngModelChange)="onGroupChange($event)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
              [disabled]="allGroups().length === 0"
            >
              <option value="">All Groups</option>
              @for (g of allGroups(); track g) {
                <option [value]="g">{{ g }}</option>
              }
            </select>
          </div>
          <div class="relative calendar-container">
            <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <button
              type="button"
              (click)="toggleCalendar()"
              class="w-full px-4 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white flex items-center justify-between"
            >
              <span>{{ selectedDate | date:'mediumDate' }}</span>
              <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </button>
            @if (isCalendarOpen) {
              <div class="absolute top-full right-0 md:left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4 w-72">
                <div class="flex items-center justify-between mb-4">
                  <button type="button" (click)="prevMonth()" class="p-1 hover:bg-gray-100 rounded-full transition text-gray-600">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <span class="font-semibold text-gray-800">{{ currentMonthName }} {{ currentYear }}</span>
                  <button type="button" (click)="nextMonth()" class="p-1 hover:bg-gray-100 rounded-full transition text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed" [disabled]="isCurrentMonthOrFuture()">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
                
                <div class="grid grid-cols-7 gap-1 text-center mb-2">
                  @for (day of weekDays; track day) {
                    <div class="text-xs font-medium text-gray-400">{{ day }}</div>
                  }
                </div>

                <div class="grid grid-cols-7 gap-1">
                  @for (d of calendarDays; track d.uuid) {
                    <button
                      type="button"
                      (click)="selectCalendarDate(d)"
                      [disabled]="d.isDisabled || d.isFuture"
                      class="h-9 w-full rounded-md flex items-center justify-center text-sm transition relative"
                      [class.opacity-0]="d.dayOfMonth === 0"
                      [class.pointer-events-none]="d.dayOfMonth === 0"
                      [class.text-gray-300]="d.isFuture && d.dayOfMonth !== 0"
                      [class.cursor-not-allowed]="d.isFuture"
                      [class.bg-blue-600]="isSelectedDate(d)"
                      [class.text-white]="isSelectedDate(d)"
                      [class.hover:bg-gray-100]="!isSelectedDate(d) && !d.isDisabled && !d.isFuture"
                    >
                      @if (d.dayOfMonth !== 0) {
                        <span>{{ d.dayOfMonth }}</span>
                        @if (!d.isFuture && d.attendanceColor) {
                          <div class="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                            [class.bg-green-500]="d.attendanceColor === 'green' && !isSelectedDate(d)"
                            [class.bg-green-200]="d.attendanceColor === 'green' && isSelectedDate(d)"
                            [class.bg-red-500]="d.attendanceColor === 'red' && !isSelectedDate(d)"
                            [class.bg-red-200]="d.attendanceColor === 'red' && isSelectedDate(d)">
                          </div>
                        }
                      }
                    </button>
                  }
                </div>
              </div>
            }
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
            <h2 class="text-base font-semibold text-blue-800">Quick Entry</h2>
          </div>

          <!-- Entry Mode Toggle -->
          <div class="flex gap-2 mb-4">
            <button
              (click)="quickEntryMode = 'rollnumber'"
              [class.bg-blue-600]="quickEntryMode === 'rollnumber'"
              [class.text-white]="quickEntryMode === 'rollnumber'"
              [class.bg-white]="quickEntryMode !== 'rollnumber'"
              [class.text-blue-700]="quickEntryMode !== 'rollnumber'"
              class="px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-300 transition"
            >
              By Roll Number
            </button>
            <button
              (click)="quickEntryMode = 'serial'"
              [class.bg-blue-600]="quickEntryMode === 'serial'"
              [class.text-white]="quickEntryMode === 'serial'"
              [class.bg-white]="quickEntryMode !== 'serial'"
              [class.text-blue-700]="quickEntryMode !== 'serial'"
              class="px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-300 transition"
            >
              By Roll No. Suffix (Group)
            </button>
          </div>

          <!-- Roll Number Mode -->
          @if (quickEntryMode === 'rollnumber') {
            <p class="text-sm text-blue-600 mb-3">
              Type roll numbers of <strong>present</strong> students separated by comma, space, or new line.
              All others will be marked <strong>Absent</strong>.
            </p>
            <textarea
              [(ngModel)]="quickEntryText"
              placeholder="e.g. 21A91A0501, 21A91A0502&#10;21A91A0503"
              rows="3"
              class="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
            ></textarea>
          }

          <!-- Serial Number (Group) Mode -->
          @if (quickEntryMode === 'serial') {
            <div class="space-y-3">
              <!-- Group selector -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Select Group</label>
                <select
                  [(ngModel)]="quickEntryGroup"
                  class="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">-- Choose a group --</option>
                  @for (g of studentGroups(); track g.name) {
                    <option [value]="g.name">{{ g.name }} ({{ g.students.length }} students)</option>
                  }
                </select>
              </div>

              @if (quickEntryGroup) {
                <!-- Preview of students in selected group -->
                <div class="bg-white border border-blue-200 rounded-lg px-4 py-2 text-xs text-gray-600 max-h-28 overflow-y-auto">
                  @for (s of getGroupStudents(quickEntryGroup); track s.id) {
                    <span class="inline-block mr-3"><span class="font-semibold text-blue-700">{{ s.rollNumber }}</span> - {{ s.name }}</span>
                  }
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Enter last digits (suffix) of <strong class="text-green-700">present</strong> students
                    <span class="text-gray-400 font-normal">(e.g. 1, 2, 3 … or ranges like 15-20)</span>
                  </label>
                  <textarea
                    [(ngModel)]="quickEntryText"
                    placeholder="e.g.  1, 2, 3, 5   or   1-10, 15, 20"
                    rows="2"
                    class="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y"
                  ></textarea>
                  <p class="text-xs text-gray-500 mt-1">
                    Only students in <strong>{{ quickEntryGroup }}</strong> are affected. Other groups stay unchanged.
                  </p>
                </div>
              }
            </div>
          }

          <div class="flex items-center gap-3 mt-3">
            <button
              (click)="applyQuickEntry()"
              [disabled]="quickEntryMode === 'serial' && !quickEntryGroup"
              class="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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

          <!-- Feedback after applying -->
          @if (quickEntryApplied()) {
            <div class="mt-3 space-y-2">
              <div class="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>{{ quickEntryFeedback() }}</span>
              </div>
              @if (unmatchedRolls().length > 0) {
                <div class="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  </svg>
                  <span>Not found: <span class="font-mono">{{ unmatchedRolls().join(', ') }}</span></span>
                </div>
              }
            </div>
          }
        </div>

        <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div class="flex gap-3">
            <button
              (click)="markAllPresent()"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              {{ quickEntryMode === 'serial' && quickEntryGroup ? 'Mark Group Present' : 'Mark All Present' }}
            </button>
            <button
              (click)="markAllAbsent()"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              {{ quickEntryMode === 'serial' && quickEntryGroup ? 'Mark Group Absent' : 'Mark All Absent' }}
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
                
                @if (isGroupAttendanceTaken(group.name)) {
                  <span class="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1 border border-green-200 shadow-sm">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Attendance Taken
                  </span>
                }
                
                <div class="flex-1 h-px bg-gray-200"></div>
              </div>
            } @else {
              <!-- For non-combined classes, show if attendance is already taken for the whole class -->
              @if (isGroupAttendanceTaken(group.name)) {
                <div class="mb-4">
                  <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-2 border border-green-200 shadow-sm inline-flex">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    Attendance already recorded for this date
                  </span>
                </div>
              }
            }

            <div class="space-y-3 mb-2">
              @for (student of group.students; track student.id; let i = $index) {
                <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                     [class.border-green-300]="getStatus(student.id) === 'present'"
                     [class.bg-green-50]="getStatus(student.id) === 'present'"
                     [class.border-red-300]="getStatus(student.id) === 'absent'"
                     [class.bg-red-50]="getStatus(student.id) === 'absent'"
                     [class.border-yellow-300]="getStatus(student.id) === 'late'"
                     [class.bg-yellow-50]="getStatus(student.id) === 'late'">
                  <div class="flex items-center gap-3 flex-1">
                    <div>
                      <h3 class="font-medium text-gray-900">{{ student.name }}</h3>
                      <p class="text-sm text-gray-500">Roll No: {{ student.rollNumber }}</p>
                    </div>
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

          <!-- Save Button (Sticky Bottom) -->
          <div class="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40 flex justify-between items-center px-6">
            <div class="text-sm font-medium">
              @if (unsavedChangesCount() > 0) {
                <span class="text-amber-600 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  Unsaved changes ({{ unsavedChangesCount() }})
                </span>
              } @else {
                <span class="text-gray-500">All changes saved or unchanged</span>
              }
            </div>
            <button
              (click)="saveAttendance()"
              [disabled]="saving() || unsavedChangesCount() === 0"
              class="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
        
        <!-- Add padding at the bottom to prevent the sticky footer from hiding the last row -->
        <div class="h-20"></div>
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
  todayDate: string = new Date().toISOString().split('T')[0];
  selectedDate: string = this.todayDate;
  selectedClassId: string = '';
  attendanceMap = new Map<number, 'present' | 'absent' | 'late'>();
  loading = signal(false);
  saving = signal(false);

  // Quick Entry state
  quickEntryMode: 'rollnumber' | 'serial' = 'rollnumber';
  quickEntryText: string = '';
  quickEntryGroup: string = '';
  quickEntryApplied = signal(false);
  matchedCount = signal(0);
  unmatchedRolls = signal<string[]>([]);
  quickEntryFeedback = signal('');

  // Computed: whether this is a combined class
  isCombinedClass = computed(() =>
    this.students().some(s => s.group && s.group.trim() !== '')
  );

  selectedGroup = signal<string>('');

  // Calendar State
  isCalendarOpen = false;
  currentCalendarDate = new Date();
  weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  calendarDays: { uuid: string, date: Date, dayOfMonth: number, isDisabled: boolean, isFuture: boolean, dateStr: string, attendanceColor?: 'green' | 'red' }[] = [];
  monthlyRecords: any[] = [];
  monthlyAttendanceStats: Map<string, boolean> = new Map();

  allGroups = computed<string[]>(() => {
    const groups = new Set<string>();
    this.students().forEach(s => {
      const g = s.group?.trim();
      if (g) groups.add(g);
    });
    return Array.from(groups).sort();
  });

  // Computed: students grouped by their group field
  studentGroups = computed<StudentGroup[]>(() => {
    const groupMap = new Map<string, Student[]>();
    const selGroup = this.selectedGroup();

    this.students().forEach(student => {
      const key = student.group?.trim() || '';
      if (!selGroup || key === selGroup) {
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(student);
      }
    });

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

  originalAttendanceMap = new Map<number, 'present' | 'absent' | 'late'>();
  unsavedChangesCountSignal = signal(0);

  getUnsavedChangesCount(): number {
    let diff = 0;
    const allKeys = new Set([...Array.from(this.attendanceMap.keys()), ...Array.from(this.originalAttendanceMap.keys())]);

    for (const key of allKeys) {
      const current = this.attendanceMap.get(key);
      const original = this.originalAttendanceMap.get(key);
      if (current !== original) diff++;
    }
    return diff;
  }

  updateUnsavedChangesSignal() {
    this.unsavedChangesCountSignal.set(this.getUnsavedChangesCount());
  }

  unsavedChangesCount() {
    return this.unsavedChangesCountSignal();
  }

  isGroupAttendanceTaken(groupName: string): boolean {
    const group = this.getGroupStudents(groupName);
    if (group.length === 0) return false;
    return group.some(student => this.originalAttendanceMap.has(student.id));
  }

  hasUnsavedChanges(): boolean {
    return this.getUnsavedChangesCount() > 0;
  }

  constructor(private http: HttpClient) { }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.hasUnsavedChanges()) {
      $event.returnValue = true;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isCalendarOpen && !target.closest('.calendar-container')) {
      this.isCalendarOpen = false;
    }
  }

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
      error: (err) => {
        console.error('Failed to load classes:', err);
        alert('Failed to load classes');
      }
    });
  }

  onDateChange(newDate: string) {
    if (this.hasUnsavedChanges()) {
      if (!confirm('You have unsaved attendance marks. Are you sure you want to change the date? Unsaved changes will be lost.')) {
        // Reset the model back to the old value
        setTimeout(() => this.selectedDate = this.selectedDate, 0);
        return;
      }
    }
    this.selectedDate = newDate;
    this.loadStudents();
  }

  onGroupChange(newGroup: string) {
    if (this.hasUnsavedChanges()) {
      if (!confirm('You have unsaved changes. Change group anyway and lose changes?')) {
        return;
      }
    }
    this.selectedGroup.set(newGroup);
    if (this.isCalendarOpen) {
      this.buildMonthlyStatsAndCalendar();
    }
  }

  onClassChange(newClassId: string) {
    if (this.hasUnsavedChanges()) {
      if (!confirm('You have unsaved attendance marks. Are you sure you want to change the class? Unsaved changes will be lost.')) {
        setTimeout(() => this.selectedClassId = this.selectedClassId, 0);
        return;
      }
    }
    this.selectedClassId = newClassId;
    this.selectedGroup.set('');
    this.loadStudents();
  }

  loadStudents() {
    if (!this.selectedClassId) {
      this.students.set([]);
      this.attendanceMap.clear();
      this.originalAttendanceMap.clear();
      this.updateUnsavedChangesSignal();
      return;
    }
    this.loading.set(true);
    this.quickEntryApplied.set(false);
    this.quickEntryText = '';
    this.quickEntryGroup = '';

    forkJoin({
      studentsRes: this.http.get<{ students: Student[] }>(`${environment.apiUrl}/students?classId=${this.selectedClassId}&_cb=${Date.now()}`),
      attendanceRes: this.http.get<any[]>(`${environment.apiUrl}/attendance/date/${this.selectedDate}?classId=${this.selectedClassId}&_cb=${Date.now()}`)
    }).subscribe({
      next: ({ studentsRes, attendanceRes }) => {
        this.students.set(studentsRes.students);

        // Populate the attendance maps with existing data
        this.attendanceMap.clear();
        this.originalAttendanceMap.clear();

        attendanceRes.forEach(record => {
          this.attendanceMap.set(record.studentId, record.status);
          this.originalAttendanceMap.set(record.studentId, record.status);
        });

        this.updateUnsavedChangesSignal();
        this.loading.set(false);

        // Refresh the calendar layout now that students are loaded
        if (this.isCalendarOpen) {
          this.fetchMonthlyAttendance();
        }
      },
      error: (err) => {
        console.error('Failed to load data:', err);
        alert('Failed to load students and attendance');
        this.loading.set(false);
      }
    });
  }

  // == Calendar Logic == //
  toggleCalendar() {
    this.isCalendarOpen = !this.isCalendarOpen;
    if (this.isCalendarOpen) {
      this.currentCalendarDate = new Date(this.selectedDate);
      this.fetchMonthlyAttendance();
    }
  }

  get currentMonthName() {
    return this.currentCalendarDate.toLocaleString('default', { month: 'long' });
  }

  get currentYear() {
    return this.currentCalendarDate.getFullYear();
  }

  prevMonth() {
    this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() - 1, 1);
    this.fetchMonthlyAttendance();
  }

  nextMonth() {
    this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() + 1, 1);
    this.fetchMonthlyAttendance();
  }

  isCurrentMonthOrFuture() {
    const today = new Date();
    return this.currentCalendarDate.getMonth() >= today.getMonth() && this.currentCalendarDate.getFullYear() >= today.getFullYear();
  }

  isSelectedDate(d: any) {
    if (d.dayOfMonth === 0) return false;
    return d.dateStr === this.selectedDate;
  }

  selectCalendarDate(d: any) {
    if (d.isDisabled || d.isFuture || d.dayOfMonth === 0) return;
    this.isCalendarOpen = false;
    if (this.selectedDate !== d.dateStr) {
      this.onDateChange(d.dateStr);
    }
  }

  fetchMonthlyAttendance() {
    if (!this.selectedClassId) return;

    // Build the bare calendar grid immediately so the UI is snappy,
    // wait for the network to add the green/red color-coding
    this.monthlyAttendanceStats.clear();
    this.buildCalendarGrid();

    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    const localStart = new Date(start.getTime() - (start.getTimezoneOffset() * 60000));
    const localEnd = new Date(end.getTime() - (end.getTimezoneOffset() * 60000));

    const startDateStr = localStart.toISOString().split('T')[0];
    const endDateStr = localEnd.toISOString().split('T')[0];

    this.http.get<any[]>(`${environment.apiUrl}/attendance/class/${this.selectedClassId}/range?startDate=${startDateStr}&endDate=${endDateStr}&_cb=${Date.now()}`)
      .subscribe({
        next: (records) => {
          this.monthlyRecords = records;
          this.buildMonthlyStatsAndCalendar();
        }
      });
  }

  buildMonthlyStatsAndCalendar() {
    this.monthlyAttendanceStats.clear();

    const recordsByDate = new Map<string, any[]>();
    this.monthlyRecords.forEach(r => {
      const dStr = r.date.split('T')[0];
      if (!recordsByDate.has(dStr)) recordsByDate.set(dStr, []);
      recordsByDate.get(dStr)!.push(r);
    });

    const groupTarget = this.selectedGroup() || '';

    recordsByDate.forEach((dayRecords, dateStr) => {
      let hasAttendanceForGroup = false;
      if (!groupTarget) {
        hasAttendanceForGroup = dayRecords.length > 0;
      } else {
        hasAttendanceForGroup = dayRecords.some(req => {
          const stu = this.students().find(s => s.id === req.student.id);
          return stu && (stu.group?.trim() || '') === groupTarget;
        });
      }
      this.monthlyAttendanceStats.set(dateStr, hasAttendanceForGroup);
    });

    this.buildCalendarGrid();
  }

  buildCalendarGrid() {
    this.calendarDays = [];
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty paddings
    for (let i = 0; i < firstDayIndex; i++) {
      this.calendarDays.push({ uuid: `empty-pre-${i}`, date: new Date(year, month, i - firstDayIndex + 1), dayOfMonth: 0, isDisabled: true, isFuture: false, dateStr: '' });
    }

    for (let i = 1; i <= lastDate; i++) {
      const d = new Date(year, month, i);
      // Correct timezone offset stripping to ensure local date string is accurate without timezone shift issues
      const localD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
      const dateStr = localD.toISOString().split('T')[0];

      const isFuture = d > today;
      let color: 'green' | 'red' | undefined = undefined;

      if (!isFuture && d.getDay() !== 0) { // Sunday = 0
        const hasAtt = this.monthlyAttendanceStats.get(dateStr);
        color = hasAtt ? 'green' : 'red';
      }

      this.calendarDays.push({
        uuid: dateStr,
        date: d,
        dayOfMonth: i,
        isDisabled: false,
        isFuture: isFuture,
        dateStr: dateStr,
        attendanceColor: color
      });
    }
  }

  /** Returns the ordered list of students for a given group name */
  getGroupStudents(groupName: string): Student[] {
    return this.studentGroups().find(g => g.name === groupName)?.students ?? [];
  }

  /**
   * Parses a string like "1, 2, 3-5, 7" into a Set of 1-based serial numbers.
   * Supports ranges (1-5) and comma/space/newline separators.
   */
  private parseSerialNumbers(input: string): Set<number> {
    const result = new Set<number>();
    // Split on comma, whitespace, or semicolon
    const tokens = input.split(/[\s,;]+/).map(t => t.trim()).filter(t => t.length > 0);
    for (const token of tokens) {
      const range = token.match(/^(\d+)-(\d+)$/);
      if (range) {
        const from = parseInt(range[1], 10);
        const to = parseInt(range[2], 10);
        for (let n = from; n <= to; n++) result.add(n);
      } else {
        const n = parseInt(token, 10);
        if (!isNaN(n)) result.add(n);
      }
    }
    return result;
  }

  applyQuickEntry() {
    if (!this.quickEntryText.trim()) return;

    if (this.quickEntryMode === 'serial') {
      this.applySerialEntry();
    } else {
      this.applyRollNumberEntry();
    }
  }

  private applySerialEntry() {
    if (!this.quickEntryGroup) return;

    const groupStudents = this.getGroupStudents(this.quickEntryGroup);
    if (groupStudents.length === 0) return;

    const presentSuffixes = this.parseSerialNumbers(this.quickEntryText);
    const notFound: number[] = [];
    let matched = 0;

    // Build suffix map using common-prefix stripping across this group's roll numbers
    const suffixMap = this.getGroupSuffixMap(groupStudents);

    // First mark all students in this group as absent
    groupStudents.forEach(student => {
      this.attendanceMap.set(student.id, 'absent');
    });

    // Then mark matched ones as present
    presentSuffixes.forEach(n => {
      const student = suffixMap.get(n);
      if (student) {
        this.attendanceMap.set(student.id, 'present');
        matched++;
      } else {
        notFound.push(n);
      }
    });

    this.matchedCount.set(matched);
    this.unmatchedRolls.set(notFound.map(n => String(n)));
    this.quickEntryFeedback.set(
      `${this.quickEntryGroup}: ${matched} marked Present, ${groupStudents.length - matched} marked Absent`
    );
    this.quickEntryApplied.set(true);
    this.updateUnsavedChangesSignal();
  }

  /**
   * Builds a map of { numericSuffix → Student } for a group by stripping
   * the longest common prefix from all roll numbers in the group.
   *
   * Example: rolls ["22572001","22572002","22572030"]
   *   common prefix = "225720"
   *   suffixes      = "01" → 1, "02" → 2, "30" → 30
   *
   * Teacher types "1" → matches 22572001  ✓
   */
  private getGroupSuffixMap(groupStudents: Student[]): Map<number, Student> {
    if (groupStudents.length === 0) return new Map();

    const rolls = groupStudents.map(s => s.rollNumber);

    // Find longest common prefix
    let prefix = rolls[0];
    for (const roll of rolls) {
      while (!roll.startsWith(prefix)) {
        prefix = prefix.slice(0, -1);
      }
      if (prefix.length === 0) break;
    }

    const map = new Map<number, Student>();
    groupStudents.forEach(student => {
      const suffix = student.rollNumber.slice(prefix.length);
      const n = parseInt(suffix, 10);
      if (!isNaN(n)) map.set(n, student);
    });

    return map;
  }


  private applyRollNumberEntry() {
    const enteredRolls = this.quickEntryText
      .split(/[\n,\s]+/)
      .map(r => r.trim().toUpperCase())
      .filter(r => r.length > 0);

    if (enteredRolls.length === 0) return;

    const studentRollMap = new Map<string, number>();
    this.students().forEach(s => studentRollMap.set(s.rollNumber.toUpperCase(), s.id));

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
    this.quickEntryFeedback.set(
      `${matched} student(s) marked Present, ${this.students().length - matched} marked Absent`
    );
    this.quickEntryApplied.set(true);
    this.updateUnsavedChangesSignal();
  }

  clearQuickEntry() {
    this.quickEntryText = '';
    this.quickEntryGroup = '';
    this.quickEntryApplied.set(false);
    this.matchedCount.set(0);
    this.unmatchedRolls.set([]);
    this.quickEntryFeedback.set('');
    // Notice: We purposefully don't clear attendanceMap here so users don't lose manual touches
    this.updateUnsavedChangesSignal();
  }

  setAttendance(studentId: number, status: 'present' | 'absent' | 'late') {
    this.attendanceMap.set(studentId, status);
    this.updateUnsavedChangesSignal();
  }

  getStatus(studentId: number): 'present' | 'absent' | 'late' | undefined {
    return this.attendanceMap.get(studentId);
  }

  markAllPresent() {
    let affectedStudents = this.students();
    if (this.quickEntryMode === 'serial' && this.quickEntryGroup) {
      affectedStudents = this.getGroupStudents(this.quickEntryGroup);
    }

    affectedStudents.forEach(s => this.attendanceMap.set(s.id, 'present'));
    this.quickEntryApplied.set(false);
    this.updateUnsavedChangesSignal();
  }

  markAllAbsent() {
    let affectedStudents = this.students();
    if (this.quickEntryMode === 'serial' && this.quickEntryGroup) {
      affectedStudents = this.getGroupStudents(this.quickEntryGroup);
    }

    affectedStudents.forEach(s => this.attendanceMap.set(s.id, 'absent'));
    this.quickEntryApplied.set(false);
    this.updateUnsavedChangesSignal();
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

        // Update original map to reflect new saved state
        this.originalAttendanceMap.clear();
        for (const [key, val] of this.attendanceMap.entries()) {
          this.originalAttendanceMap.set(key, val);
        }
        this.updateUnsavedChangesSignal();

        // Refresh the calendar if it happens to be open
        if (this.isCalendarOpen) {
          this.fetchMonthlyAttendance();
        }

        this.quickEntryApplied.set(false);
        this.quickEntryText = '';
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Failed to save attendance:', err);
        alert('Failed to save attendance');
        this.saving.set(false);
      }
    });
  }
}
