import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassService, Class } from '../../core/services/class.service';
import { ReportService } from '../../core/services/report.service';

@Component({
    selector: 'app-reports',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p class="text-gray-600 mt-1">View attendance statistics and export data</p>
      </div>

      <!-- Filters -->
      <div class="card">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select [(ngModel)]="selectedClassId" (change)="loadReport()" class="input">
              <option [value]="null">Select a class</option>
              @for (class of classes(); track class.id) {
                <option [value]="class.id">{{ class.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input type="date" [(ngModel)]="startDate" (change)="loadReport()" class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input type="date" [(ngModel)]="endDate" (change)="loadReport()" class="input" />
          </div>
        </div>
        <div class="mt-4">
          <button
            (click)="exportToCSV()"
            [disabled]="!selectedClassId || exporting()"
            class="btn btn-primary"
          >
            @if (exporting()) {
              <span class="spinner mr-2"></span>
            }
            📥 Export to CSV
          </button>
        </div>
      </div>

      <!-- Summary Stats -->
      @if (selectedClassId && summary()) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card bg-blue-50 border-blue-200">
            <p class="text-sm text-blue-600 font-medium">Total Students</p>
            <p class="text-3xl font-bold text-blue-900 mt-1">{{ summary()!.totalStudents }}</p>
          </div>
          <div class="card bg-green-50 border-green-200">
            <p class="text-sm text-green-600 font-medium">Average Attendance</p>
            <p class="text-3xl font-bold text-green-900 mt-1">{{ getAverageAttendance() }}%</p>
          </div>
          <div class="card bg-purple-50 border-purple-200">
            <p class="text-sm text-purple-600 font-medium">Total Days</p>
            <p class="text-3xl font-bold text-purple-900 mt-1">{{ getTotalDays() }}</p>
          </div>
        </div>
      }

      <!-- Student List -->
      @if (selectedClassId) {
        <div class="card">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Student Attendance Summary</h2>
          
          @if (loading()) {
            <div class="flex justify-center py-8">
              <div class="spinner"></div>
            </div>
          } @else if (!summary() || summary()!.students.length === 0) {
            <div class="text-center py-12 text-gray-500">
              <p class="text-lg">No data available</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Days</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  @for (student of summary()!.students; track student.id) {
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ student.rollNumber }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ student.name }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ student.totalDays }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600">{{ student.presentDays }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-red-600">{{ student.absentDays }}</td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          class="px-3 py-1 rounded-full text-sm font-medium"
                          [class]="getPercentageClass(student.percentage)"
                        >
                          {{ student.percentage.toFixed(1) }}%
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ReportsComponent implements OnInit {
    private classService = inject(ClassService);
    private reportService = inject(ReportService);

    classes = signal<Class[]>([]);
    summary = signal<any>(null);
    loading = signal(false);
    exporting = signal(false);

    selectedClassId: number | null = null;
    startDate = '';
    endDate = '';

    ngOnInit(): void {
        this.loadClasses();
    }

    loadClasses(): void {
        this.classService.getAll().subscribe({
            next: (classes) => this.classes.set(classes)
        });
    }

    loadReport(): void {
        if (!this.selectedClassId) return;

        this.loading.set(true);
        this.reportService.getClassSummary(
            this.selectedClassId,
            this.startDate || undefined,
            this.endDate || undefined
        ).subscribe({
            next: (data) => {
                this.summary.set(data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    exportToCSV(): void {
        if (!this.selectedClassId) return;

        this.exporting.set(true);
        this.reportService.exportCSV(
            this.selectedClassId,
            this.startDate || undefined,
            this.endDate || undefined
        ).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
                this.exporting.set(false);
            },
            error: () => this.exporting.set(false)
        });
    }

    getAverageAttendance(): number {
        const data = this.summary();
        if (!data || data.students.length === 0) return 0;
        const total = data.students.reduce((sum: number, s: any) => sum + s.percentage, 0);
        return Math.round(total / data.students.length * 10) / 10;
    }

    getTotalDays(): number {
        const data = this.summary();
        if (!data || data.students.length === 0) return 0;
        return Math.max(...data.students.map((s: any) => s.totalDays));
    }

    getPercentageClass(percentage: number): string {
        if (percentage >= 75) return 'bg-green-100 text-green-800';
        if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    }
}
