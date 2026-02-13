import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamMarkService, ExamMark, ExamMarkStats } from '../../core/services/exam-mark.service';
import { ClassService, Class } from '../../core/services/class.service';
import { StudentService, Student } from '../../core/services/student.service';

interface StudentMarkEntry {
  student: Student;
  marks: number | null;
  existingMarkId?: number;
}

@Component({
  selector: 'app-exam-marks',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Exam Marks</h1>
        <p class="text-gray-600 mt-1">Enter marks for all students at once</p>
      </div>

      <!-- Selection Filters -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Select Exam Details</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Class *</label>
            <select [(ngModel)]="selectedClassId" (change)="onClassChange()" class="input">
              <option [value]="null">Select a class</option>
              @for (class of classes(); track class.id) {
                <option [value]="class.id">{{ class.name }} - {{ class.subject }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
            <select [(ngModel)]="selectedSemester" (change)="onExamDetailsChange()" class="input">
              <option value="">Select semester</option>
              <option value="semester1">Semester 1</option>
              <option value="semester2">Semester 2</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Exam Type *</label>
            <select [(ngModel)]="selectedExamType" (change)="onExamDetailsChange()" class="input">
              <option value="">Select exam</option>
              <option value="mid1">Mid-1</option>
              <option value="mid2">Mid-2</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
            <input [(ngModel)]="selectedAcademicYear" (change)="onExamDetailsChange()" type="text" 
                   placeholder="e.g., 2025-2026" class="input" />
          </div>
        </div>
      </div>

      <!-- Statistics -->
      @if (selectedClassId && selectedSemester && selectedExamType && stats()) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="card bg-blue-50">
            <div class="text-sm text-blue-600 font-medium">Average Marks</div>
            <div class="text-2xl font-bold text-blue-900 mt-1">{{ stats()!.averageMarks }}</div>
            <div class="text-xs text-blue-600 mt-1">out of 28</div>
          </div>

          <div class="card bg-green-50">
            <div class="text-sm text-green-600 font-medium">Pass Rate</div>
            <div class="text-2xl font-bold text-green-900 mt-1">{{ stats()!.passPercentage }}%</div>
            <div class="text-xs text-green-600 mt-1">{{ stats()!.passCount }} passed</div>
          </div>

          <div class="card bg-purple-50">
            <div class="text-sm text-purple-600 font-medium">Highest Marks</div>
            <div class="text-2xl font-bold text-purple-900 mt-1">{{ stats()!.highestMarks }}</div>
            <div class="text-xs text-purple-600 mt-1">out of 28</div>
          </div>

          <div class="card bg-orange-50">
            <div class="text-sm text-orange-600 font-medium">Lowest Marks</div>
            <div class="text-2xl font-bold text-orange-900 mt-1">{{ stats()!.lowestMarks }}</div>
            <div class="text-xs text-orange-600 mt-1">out of 28</div>
          </div>
        </div>
      }

      <!-- Bulk Entry Table -->
      @if (selectedClassId && selectedSemester && selectedExamType) {
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Enter Marks for All Students</h3>
            <div class="flex gap-2">
              <input type="file" #fileInput accept="image/*" (change)="onImageUpload($event)" class="hidden" />
              <button (click)="fileInput.click()" [disabled]="ocrProcessing()" class="btn btn-secondary">
                @if (ocrProcessing()) {
                  <span class="spinner mr-2"></span>
                }
                📷 Upload Mark Sheet
              </button>
              <button (click)="clearAllMarks()" class="btn btn-secondary">Clear All</button>
              <button (click)="saveAllMarks()" [disabled]="submitting()" class="btn btn-primary">
                @if (submitting()) {
                  <span class="spinner mr-2"></span>
                }
                💾 Save All Marks
              </button>
            </div>
          </div>

          @if (error()) {
            <div class="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm">
              {{ error() }}
            </div>
          }

          @if (success()) {
            <div class="mb-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm">
              {{ success() }}
            </div>
          }

          @if (loading()) {
            <div class="flex justify-center py-8">
              <div class="spinner"></div>
            </div>
          } @else if (studentMarks().length === 0) {
            <div class="text-center py-12 text-gray-500">
              <p class="text-lg">No students found in this class</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks (out of 28)</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  @for (entry of studentMarks(); track entry.student.id) {
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {{ entry.student.rollNumber }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ entry.student.name }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <input 
                          [(ngModel)]="entry.marks" 
                          type="number" 
                          min="0" 
                          max="28" 
                          step="0.5"
                          placeholder="Enter marks"
                          class="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        @if (entry.marks !== null && entry.marks !== undefined) {
                          <span class="px-2 py-1 rounded-full text-xs font-medium"
                                [class]="entry.marks >= 14 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                            {{ entry.marks >= 14 ? 'Pass' : 'Fail' }} ({{ entry.marks }}/28)
                          </span>
                        } @else {
                          <span class="text-gray-400 text-xs">Not entered</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="mt-4 text-sm text-gray-600">
              <p>💡 <strong>Tip:</strong> Pass mark is 14/28 (50%). You can enter marks with decimals (e.g., 14.5).</p>
            </div>
          }
        </div>
      } @else {
        <div class="card">
          <div class="text-center py-12 text-gray-500">
            <p class="text-lg">👆 Please select class, semester, exam type, and academic year above</p>
            <p class="text-sm mt-2">Then you can enter marks for all students at once</p>
          </div>
        </div>
      }

      <!-- View Existing Marks -->
      @if (selectedClassId) {
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Previously Entered Marks</h3>
            <button (click)="toggleViewAll()" class="text-blue-600 hover:text-blue-800 text-sm">
              {{ showAllMarks ? 'Hide' : 'Show All Marks' }}
            </button>
          </div>

          @if (showAllMarks) {
            @if (loadingAll()) {
              <div class="flex justify-center py-8">
                <div class="spinner"></div>
              </div>
            } @else if (allExamMarks().length === 0) {
              <div class="text-center py-8 text-gray-500">
                <p>No marks entered yet for this class</p>
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Semester</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    @for (mark of allExamMarks(); track mark.id) {
                      <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {{ mark.student?.rollNumber }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {{ mark.student?.name }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ mark.semester === 'semester1' ? 'Sem 1' : 'Sem 2' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ mark.examType === 'mid1' ? 'Mid-1' : 'Mid-2' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ mark.academicYear }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class="px-2 py-1 rounded-full text-xs font-medium"
                                [class]="mark.marks >= 14 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                            {{ mark.marks }}/28
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          <button (click)="deleteMark(mark.id)" class="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        </div>
      }
    </div>
  `
})
export class ExamMarksComponent implements OnInit {
  private examMarkService = inject(ExamMarkService);
  private classService = inject(ClassService);
  private studentService = inject(StudentService);

  classes = signal<Class[]>([]);
  studentMarks = signal<StudentMarkEntry[]>([]);
  allExamMarks = signal<ExamMark[]>([]);
  stats = signal<ExamMarkStats | null>(null);
  loading = signal(false);
  loadingAll = signal(false);
  submitting = signal(false);
  error = signal<string>('');
  success = signal<string>('');
  ocrProcessing = signal(false);

  selectedClassId: number | null = null;
  selectedAcademicYear: string = '';
  selectedSemester: string = '';
  selectedExamType: string = '';
  showAllMarks = false;

  ngOnInit(): void {
    this.loadClasses();
    // Set default academic year
    const currentYear = new Date().getFullYear();
    this.selectedAcademicYear = `${currentYear}-${currentYear + 1}`;
  }

  loadClasses(): void {
    this.classService.getAll().subscribe({
      next: (classes) => this.classes.set(classes)
    });
  }

  onClassChange(): void {
    this.studentMarks.set([]);
    this.stats.set(null);
    this.showAllMarks = false;
    if (this.selectedClassId && this.selectedSemester && this.selectedExamType) {
      this.loadStudentsForMarks();
    }
  }

  onExamDetailsChange(): void {
    if (this.selectedClassId && this.selectedSemester && this.selectedExamType && this.selectedAcademicYear) {
      this.loadStudentsForMarks();
      this.loadStats();
    }
  }

  loadStudentsForMarks(): void {
    if (!this.selectedClassId || !this.selectedSemester || !this.selectedExamType) return;

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    // Load students
    this.studentService.getAll({ classId: this.selectedClassId }).subscribe({
      next: (response) => {
        // Load existing marks for this exam
        const filters = {
          academicYear: this.selectedAcademicYear,
          semester: this.selectedSemester,
          examType: this.selectedExamType
        };

        this.examMarkService.getExamMarksByClass(this.selectedClassId!, filters).subscribe({
          next: (existingMarks) => {
            // Create mark entries for all students
            const entries: StudentMarkEntry[] = response.students.map(student => {
              const existingMark = existingMarks.find(m => m.studentId === student.id);
              return {
                student,
                marks: existingMark ? existingMark.marks : null,
                existingMarkId: existingMark?.id
              };
            });
            this.studentMarks.set(entries);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.error.set('Failed to load existing marks');
          }
        });
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to load students');
      }
    });
  }

  loadStats(): void {
    if (!this.selectedClassId) return;

    const filters: any = {};
    if (this.selectedAcademicYear) filters.academicYear = this.selectedAcademicYear;
    if (this.selectedSemester) filters.semester = this.selectedSemester;

    this.examMarkService.getExamMarkStats(this.selectedClassId, filters).subscribe({
      next: (stats) => this.stats.set(stats)
    });
  }

  saveAllMarks(): void {
    if (!this.selectedClassId || !this.selectedSemester || !this.selectedExamType || !this.selectedAcademicYear) {
      this.error.set('Please select all required fields');
      return;
    }

    // Filter entries that have marks entered
    const marksToSave = this.studentMarks().filter(entry =>
      entry.marks !== null && entry.marks !== undefined && entry.marks >= 0 && entry.marks <= 28
    );

    if (marksToSave.length === 0) {
      this.error.set('Please enter marks for at least one student');
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    this.success.set('');

    // Create or update marks one by one
    const requests = marksToSave.map(entry => {
      const data = {
        studentId: entry.student.id,
        classId: this.selectedClassId!,
        semester: this.selectedSemester,
        examType: this.selectedExamType,
        marks: entry.marks!,
        academicYear: this.selectedAcademicYear
      };

      // If mark exists, update it; otherwise create new
      if (entry.existingMarkId) {
        return this.examMarkService.updateExamMark(entry.existingMarkId, entry.marks!);
      } else {
        return this.examMarkService.createExamMark(data);
      }
    });

    // Execute all requests
    let completed = 0;
    let failed = 0;

    requests.forEach(request => {
      request.subscribe({
        next: () => {
          completed++;
          if (completed + failed === requests.length) {
            this.submitting.set(false);
            if (failed === 0) {
              this.success.set(`✅ Successfully saved marks for ${completed} student(s)!`);
              this.loadStudentsForMarks();
              this.loadStats();
              setTimeout(() => this.success.set(''), 5000);
            } else {
              this.error.set(`Saved ${completed} marks, but ${failed} failed. Please try again.`);
            }
          }
        },
        error: () => {
          failed++;
          if (completed + failed === requests.length) {
            this.submitting.set(false);
            this.error.set(`Saved ${completed} marks, but ${failed} failed. Please try again.`);
          }
        }
      });
    });
  }

  clearAllMarks(): void {
    if (confirm('Are you sure you want to clear all entered marks? This will not delete saved marks.')) {
      const entries = this.studentMarks().map(entry => ({
        ...entry,
        marks: entry.existingMarkId ? entry.marks : null
      }));
      this.studentMarks.set(entries);
    }
  }

  toggleViewAll(): void {
    this.showAllMarks = !this.showAllMarks;
    if (this.showAllMarks && this.selectedClassId) {
      this.loadAllMarks();
    }
  }

  loadAllMarks(): void {
    if (!this.selectedClassId) return;

    this.loadingAll.set(true);
    this.examMarkService.getExamMarksByClass(this.selectedClassId, {}).subscribe({
      next: (marks) => {
        this.allExamMarks.set(marks);
        this.loadingAll.set(false);
      },
      error: () => this.loadingAll.set(false)
    });
  }

  deleteMark(id: number): void {
    if (confirm('Are you sure you want to delete this mark?')) {
      this.examMarkService.deleteExamMark(id).subscribe({
        next: () => {
          this.success.set('Mark deleted successfully');
          this.loadAllMarks();
          this.loadStudentsForMarks();
          this.loadStats();
          setTimeout(() => this.success.set(''), 3000);
        },
        error: () => {
          this.error.set('Failed to delete mark');
        }
      });
    }
  }

  // OCR Image Upload Methods
  onImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.error.set('Please upload an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      this.error.set('Image file is too large. Maximum size is 10MB');
      return;
    }

    this.processImageWithOCR(file);
  }

  processImageWithOCR(file: File): void {
    this.ocrProcessing.set(true);
    this.error.set('');
    this.success.set('');

    const formData = new FormData();
    formData.append('image', file);

    this.examMarkService.processMarkSheetOCR(formData).subscribe({
      next: (response: { success: boolean; data: Array<{ rollNumber: string; marks: number }>; count: number }) => {
        const extractedData = response.data;

        if (!extractedData || extractedData.length === 0) {
          this.error.set('No marks data found in the image. Please try a clearer photo.');
          this.ocrProcessing.set(false);
          return;
        }

        // Apply extracted marks to student entries
        this.applyExtractedMarks(extractedData);

        this.success.set(`✅ Successfully extracted marks for ${extractedData.length} student(s) from image!`);
        this.ocrProcessing.set(false);

        // Clear success message after 5 seconds
        setTimeout(() => this.success.set(''), 5000);
      },
      error: (err: any) => {
        console.error('OCR error:', err);
        this.error.set(err.error?.message || 'Failed to process image. Please try again with a clearer photo.');
        this.ocrProcessing.set(false);
      }
    });
  }

  applyExtractedMarks(extractedData: Array<{ rollNumber: string, marks: number }>): void {
    const currentMarks = this.studentMarks();
    let matchedCount = 0;
    let unmatchedRollNumbers: string[] = [];

    // Create a map of roll numbers to marks from extracted data
    const marksMap = new Map(extractedData.map(item => [item.rollNumber, item.marks]));

    // Update marks for matched students
    const updatedMarks = currentMarks.map(entry => {
      const extractedMark = marksMap.get(entry.student.rollNumber);
      if (extractedMark !== undefined) {
        matchedCount++;
        marksMap.delete(entry.student.rollNumber); // Remove from map to track unmatched
        return { ...entry, marks: extractedMark };
      }
      return entry;
    });

    // Track unmatched roll numbers from OCR
    unmatchedRollNumbers = Array.from(marksMap.keys());

    this.studentMarks.set(updatedMarks);

    // Show warning for unmatched roll numbers
    if (unmatchedRollNumbers.length > 0) {
      const warning = `⚠️ ${unmatchedRollNumbers.length} roll number(s) from the image were not found in this class: ${unmatchedRollNumbers.join(', ')}`;
      setTimeout(() => {
        this.error.set(warning);
      }, 100);
    }
  }
}
