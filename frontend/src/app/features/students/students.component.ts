import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService, Student } from '../../core/services/student.service';
import { ClassService, Class } from '../../core/services/class.service';

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
          <button (click)="showImportModal = true" class="btn btn-secondary">
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
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ student.class?.name || '-' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <button (click)="deleteStudent(student.id)" class="text-red-600 hover:text-red-800">Delete</button>
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
                [disabled]="!selectedFile || !importClassId || importing()"
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
    </div>
  `
})
export class StudentsComponent implements OnInit {
    private studentService = inject(StudentService);
    private classService = inject(ClassService);

    students = signal<Student[]>([]);
    classes = signal<Class[]>([]);
    loading = signal(true);
    selectedClassId: number | null = null;

    showImportModal = false;
    showAddModal = false;
    selectedFile: File | null = null;
    importClassId: number | null = null;
    importing = signal(false);
    importResult = signal<any>(null);

    newStudent = {
        rollNumber: '',
        name: '',
        email: '',
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

    onFileSelected(event: any): void {
        this.selectedFile = event.target.files[0];
        this.importResult.set(null);
    }

    importStudents(): void {
        if (!this.selectedFile || !this.importClassId) return;

        this.importing.set(true);
        this.studentService.importFromFile(this.selectedFile, this.importClassId).subscribe({
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
            classId: this.newStudent.classId as number
        };

        this.studentService.create(studentData).subscribe({
            next: () => {
                this.showAddModal = false;
                this.newStudent = { rollNumber: '', name: '', email: '', classId: null };
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
}
