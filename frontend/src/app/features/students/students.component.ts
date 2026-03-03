import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService, Student } from '../../core/services/student.service';
import { ClassService, Class } from '../../core/services/class.service';
import { ReportService } from '../../core/services/report.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-students',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Students</h1>
          <p class="text-gray-600 mt-1">Manage your student records</p>
        </div>
        <div class="flex gap-2">
          <button (click)="openImportModal()" class="btn btn-secondary">
            📁 Import CSV/Excel
          </button>
          <button (click)="showAddModal = true" class="btn btn-primary">
            ➕ Add Student
          </button>
        </div>
      </div>

      <!-- Class Filter -->
      <div class="card">
        <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Class</label>
        <select [(ngModel)]="selectedClassId" (change)="loadStudents()" class="input max-w-xs">
          <option [value]="null">All Classes</option>
          @for (class of classes(); track class.id) {
            <option [value]="class.id">{{ class.name }}</option>
          }
        </select>
      </div>

      <!-- Students Table -->
      <div class="card">
        @if (loading()) {
          <div class="flex justify-center py-8">
            <div class="spinner"></div>
          </div>
        } @else if (students().length === 0) {
          <div class="text-center py-12 text-gray-500">
            <p class="text-lg">No students found</p>
            <p class="text-sm mt-2">Add students manually or import from CSV/Excel</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group/Branch</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (student of students(); track student.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ student.rollNumber }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ student.name }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ student.email || '-' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      @if (student.group) {
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{{ student.group }}</span>
                      } @else {
                        <span class="text-gray-400">-</span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ student.class?.name || '-' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3">
                      <button (click)="openAttendanceModal(student)" class="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Attendance
                      </button>
                      <button (click)="deleteStudent(student.id)" class="text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded transition-colors">Delete</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Import Modal -->
      @if (showImportModal) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="showImportModal = false">
          <div class="bg-white rounded-lg p-6 max-w-md w-full" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-bold mb-4">Import Students from CSV/Excel</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
                <select [(ngModel)]="importClassId" class="input">
                  <option [value]="null">Select a class</option>
                  @for (class of classes(); track class.id) {
                    <option [value]="class.id">{{ class.name }}</option>
                  }
                </select>
              </div>

              <!-- Combined Class Toggle -->
              <div class="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <input
                  type="checkbox"
                  id="combinedClassCheck"
                  [(ngModel)]="isCombinedClass"
                  class="w-4 h-4 text-blue-600 rounded"
                />
                <label for="combinedClassCheck" class="text-sm font-medium text-blue-800 cursor-pointer">
                  Combined Class (multiple groups/branches)
                </label>
              </div>

              <!-- Group Name Input (shown only when combined class is checked) -->
              @if (isCombinedClass) {
                <div class="border-l-4 border-blue-400 pl-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Group / Branch Name
                    <span class="text-red-500">*</span>
                  </label>
                  <input
                    [(ngModel)]="importGroupName"
                    placeholder="e.g. Biotechnology, Microbiology, Politics..."
                    class="input"
                  />
                  <p class="text-xs text-gray-500 mt-1">
                    All students from this file will be tagged with this group name.
                    Import again with a different group name for the next batch.
                  </p>
                </div>
              }

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  (change)="onFileSelected($event)"
                  class="input"
                />
                <p class="text-xs text-gray-500 mt-1">Supported formats: CSV, Excel (.xlsx, .xls)</p>
              </div>

              @if (importResult()) {
                <div class="p-3 rounded-lg" [class]="importResult()!.success > 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
                  <p class="font-medium">Import Results:</p>
                  <p class="text-sm">✅ Success: {{ importResult()!.success }}</p>
                  <p class="text-sm">❌ Failed: {{ importResult()!.failed }}</p>
                  @if (importResult()!.errors && importResult()!.errors.length > 0) {
                    <details class="mt-2 text-xs">
                      <summary class="cursor-pointer">View Errors</summary>
                      <ul class="mt-1 list-disc list-inside">
                        @for (error of importResult()!.errors.slice(0, 5); track $index) {
                          <li>Row {{ error.row }}: {{ error.error }}</li>
                        }
                      </ul>
                    </details>
                  }
                </div>
              }
            </div>

            <div class="flex justify-end gap-2 mt-6">
              <button (click)="showImportModal = false" class="btn btn-secondary">Cancel</button>
              <button
                (click)="importStudents()"
                [disabled]="!selectedFile || !importClassId || (isCombinedClass && !importGroupName.trim()) || importing()"
                class="btn btn-primary"
              >
                @if (importing()) {
                  <span class="spinner mr-2"></span>
                }
                Import
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Add Student Modal -->
      @if (showAddModal) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" (click)="showAddModal = false">
          <div class="bg-white rounded-lg p-6 max-w-md w-full" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-bold mb-4">Add New Student</h3>
            
            <form (ngSubmit)="addStudent()" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Roll Number</label>
                <input [(ngModel)]="newStudent.rollNumber" name="rollNumber" required class="input" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input [(ngModel)]="newStudent.name" name="name" required class="input" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                <input [(ngModel)]="newStudent.email" name="email" type="email" class="input" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Group / Branch (Optional)</label>
                <input [(ngModel)]="newStudent.group" name="group" placeholder="e.g. Biotechnology" class="input" />
                <p class="text-xs text-gray-500 mt-1">Leave blank for single-group classes</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select [(ngModel)]="newStudent.classId" name="classId" required class="input">
                  <option [value]="null">Select a class</option>
                  @for (class of classes(); track class.id) {
                    <option [value]="class.id">{{ class.name }}</option>
                  }
                </select>
              </div>

              <div class="flex justify-end gap-2 mt-6">
                <button type="button" (click)="showAddModal = false" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Student Attendance Modal -->
      @if (showAttendanceModal && selectedStudentForAttendance) {
        <div class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4" (click)="closeAttendanceModal()">
          <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[90vh] overflow-hidden" (click)="$event.stopPropagation()">
            
            <!-- Header -->
            <div class="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl ring-4 ring-blue-50">
                  {{ selectedStudentForAttendance.name.charAt(0) | uppercase }}
                </div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900">{{ selectedStudentForAttendance.name }}</h3>
                  <div class="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span class="flex items-center gap-1">
                      <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      Roll No: <span class="font-semibold text-gray-700">{{ selectedStudentForAttendance.rollNumber }}</span>
                    </span>
                    @if (selectedStudentForAttendance.group) {
                      <span class="text-gray-300">•</span>
                      <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-medium text-xs border border-indigo-100">
                        {{ selectedStudentForAttendance.group }}
                      </span>
                    }
                  </div>
                </div>
              </div>
              <button (click)="closeAttendanceModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- Body -->
            <div class="px-6 py-6 overflow-y-auto flex-1 bg-gray-50/30">
              @if (attendanceLoading()) {
                <div class="flex flex-col justify-center items-center py-16">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p class="text-gray-500 font-medium animate-pulse">Fetching attendance records...</p>
                </div>
              } @else if (studentAttendanceSummary()) {
                
                <!-- Stats Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                    <span class="text-gray-500 text-sm font-medium mb-1">Total Classes</span>
                    <span class="text-3xl font-bold text-gray-800">{{ studentAttendanceSummary()?.totalDays || 0 }}</span>
                  </div>
                  
                  <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 shadow-sm flex flex-col relative overflow-hidden">
                    <div class="absolute -right-2 -top-2 opacity-50 text-green-200">
                      <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                    </div>
                    <span class="text-green-800 text-sm font-semibold mb-1 relative z-10">Present</span>
                    <span class="text-3xl font-bold text-green-700 relative z-10">{{ studentAttendanceSummary()?.presentDays || 0 }}</span>
                  </div>
                  
                  <div class="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-100 shadow-sm flex flex-col relative overflow-hidden">
                     <div class="absolute -right-2 -top-2 opacity-30 text-red-200">
                      <svg class="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
                    </div>
                    <span class="text-red-800 text-sm font-semibold mb-1 relative z-10">Absent</span>
                    <span class="text-3xl font-bold text-red-600 relative z-10">{{ studentAttendanceSummary()?.absentDays || 0 }}</span>
                  </div>
                  
                  <div class="p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center"
                       [ngClass]="{
                         'bg-green-50 border-green-200 text-green-800': studentAttendanceSummary()!.percentage >= 75,
                         'bg-yellow-50 border-yellow-200 text-yellow-800': studentAttendanceSummary()!.percentage >= 60 && studentAttendanceSummary()!.percentage < 75,
                         'bg-red-50 border-red-200 text-red-800': studentAttendanceSummary()!.percentage < 60
                       }">
                    <span class="text-xs uppercase tracking-wider font-bold mb-1 opacity-80">Overall</span>
                    <span class="text-3xl font-black tracking-tight">{{ studentAttendanceSummary()?.percentage }}%</span>
                  </div>
                </div>

                <!-- History Table -->
                <div class="bg-white border text-sm border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <div class="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <h4 class="font-bold text-gray-800">Attendance History</h4>
                    <span class="text-xs font-semibold px-2.5 py-1 bg-gray-200 text-gray-700 rounded-full flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {{ studentAttendanceHistory().length }} records
                    </span>
                  </div>
                  
                  <div class="overflow-y-auto max-h-[300px]">
                    @if (studentAttendanceHistory().length === 0) {
                      <div class="p-8 text-center text-gray-500">
                        No recorded attendance dates found for this student.
                      </div>
                    } @else {
                      <table class="min-w-full divide-y divide-gray-100">
                        <thead class="bg-white sticky top-0 z-10 hidden sm:table-header-group">
                          <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Date</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Class/Subject</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white">Status</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                          @for (record of studentAttendanceHistory(); track record.id) {
                            <tr class="hover:bg-gray-50/80 transition-colors">
                              <td class="px-6 py-3.5 whitespace-nowrap text-gray-900 font-medium">
                                {{ record.date | date:'mediumDate' }}
                                <span class="pl-2 text-gray-400 text-xs sm:hidden">{{ record.date | date:'shortTime' }}</span>
                              </td>
                              <td class="px-6 py-3.5 whitespace-nowrap">
                                <span class="text-gray-800 font-medium">{{ record.class.name }}</span>
                                @if (record.class.subject) {
                                  <span class="text-gray-400 text-xs ml-1 block sm:inline">({{ record.class.subject }})</span>
                                }
                              </td>
                              <td class="px-6 py-3.5 whitespace-nowrap">
                                @switch (record.status) {
                                  @case ('present') {
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                      <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Present
                                    </span>
                                  }
                                  @case ('absent') {
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                      <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Absent
                                    </span>
                                  }
                                  @case ('late') {
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                      <span class="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Late
                                    </span>
                                  }
                                  @default {
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                      {{ record.status | titlecase }}
                                    </span>
                                  }
                                }
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    }
                  </div>
                </div>
              } @else {
                <div class="text-center py-12">
                  <p class="text-red-500">Failed to load attendance data.</p>
                </div>
              }
            </div>
            
          </div>
        </div>
      }
    </div>
  `
})
export class StudentsComponent implements OnInit {
  private studentService = inject(StudentService);
  private classService = inject(ClassService);
  private reportService = inject(ReportService);
  private attendanceService = inject(AttendanceService);

  students = signal<Student[]>([]);
  classes = signal<Class[]>([]);
  loading = signal(true);
  selectedClassId: number | null = null;

  showImportModal = false;
  showAddModal = false;

  // Attendance View Modal State
  showAttendanceModal = false;
  selectedStudentForAttendance: Student | null = null;
  attendanceLoading = signal(false);
  studentAttendanceSummary = signal<any>(null);
  studentAttendanceHistory = signal<any[]>([]);

  selectedFile: File | null = null;
  importClassId: number | null = null;
  isCombinedClass = false;
  importGroupName = '';
  importing = signal(false);
  importResult = signal<any>(null);

  newStudent = {
    rollNumber: '',
    name: '',
    email: '',
    group: '',
    classId: null as number | null
  };

  ngOnInit(): void {
    this.loadClasses();
    this.loadStudents();
  }

  loadClasses(): void {
    this.classService.getAll().subscribe({
      next: (classes) => this.classes.set(classes)
    });
  }

  loadStudents(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.selectedClassId) params.classId = this.selectedClassId;

    this.studentService.getAll(params).subscribe({
      next: (response) => {
        this.students.set(response.students);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openImportModal(): void {
    this.showImportModal = true;
    this.isCombinedClass = false;
    this.importGroupName = '';
    this.importResult.set(null);
    this.selectedFile = null;
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
    this.importResult.set(null);
  }

  importStudents(): void {
    if (!this.selectedFile || !this.importClassId) return;
    if (this.isCombinedClass && !this.importGroupName.trim()) return;

    this.importing.set(true);
    const group = this.isCombinedClass ? this.importGroupName.trim() : undefined;
    this.studentService.importFromFile(this.selectedFile, this.importClassId, group).subscribe({
      next: (result) => {
        this.importResult.set(result);
        this.importing.set(false);
        if (result.success > 0) {
          this.loadStudents();
        }
      },
      error: () => {
        this.importing.set(false);
        this.importResult.set({ success: 0, failed: 1, errors: [{ error: 'Import failed' }] });
      }
    });
  }

  addStudent(): void {
    if (!this.newStudent.rollNumber || !this.newStudent.name || !this.newStudent.classId) return;

    const studentData = {
      rollNumber: this.newStudent.rollNumber,
      name: this.newStudent.name,
      email: this.newStudent.email || undefined,
      group: this.newStudent.group || undefined,
      classId: this.newStudent.classId as number
    };

    this.studentService.create(studentData).subscribe({
      next: () => {
        this.showAddModal = false;
        this.newStudent = { rollNumber: '', name: '', email: '', group: '', classId: null };
        this.loadStudents();
      }
    });
  }

  deleteStudent(id: number): void {
    if (confirm('Are you sure you want to delete this student?')) {
      this.studentService.delete(id).subscribe({
        next: () => this.loadStudents()
      });
    }
  }

  openAttendanceModal(student: Student): void {
    this.selectedStudentForAttendance = student;
    this.showAttendanceModal = true;
    this.attendanceLoading.set(true);

    // Fetch summary stats and raw history concurrently
    forkJoin({
      summary: this.reportService.getStudentPercentage(student.id, this.selectedClassId || undefined),
      history: this.attendanceService.getStudentAttendance(student.id)
    }).subscribe({
      next: ({ summary, history }) => {
        // We only want to show history for the selected class if a class filter is active.
        let filteredHistory = history;
        if (this.selectedClassId) {
          filteredHistory = history.filter(h => h.classId === Number(this.selectedClassId));
        }

        this.studentAttendanceSummary.set(summary);
        this.studentAttendanceHistory.set(filteredHistory);
        this.attendanceLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load student attendance UI:', err);
        this.studentAttendanceSummary.set(null);
        this.studentAttendanceHistory.set([]);
        this.attendanceLoading.set(false);
      }
    });
  }

  closeAttendanceModal(): void {
    this.showAttendanceModal = false;
    this.selectedStudentForAttendance = null;
    this.studentAttendanceSummary.set(null);
    this.studentAttendanceHistory.set([]);
  }
}
