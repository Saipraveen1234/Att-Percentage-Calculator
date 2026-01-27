import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClassService, Class } from '../../core/services/class.service';

@Component({
    selector: 'app-classes',
    imports: [CommonModule, FormsModule],
    template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Classes</h1>
          <p class="text-gray-600 mt-1">Manage your classes and subjects</p>
        </div>
        <button (click)="showAddModal = true" class="btn btn-primary">
          + Add Class
        </button>
      </div>

      <!-- Classes Grid -->
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="spinner"></div>
        </div>
      } @else if (classes().length === 0) {
        <div class="card text-center py-12">
          <div class="text-6xl mb-4">📚</div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No classes yet</h3>
          <p class="text-gray-600 mb-4">Create your first class to get started</p>
          <button (click)="showAddModal = true" class="btn btn-primary">
            Create Class
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (class of classes(); track class.id) {
            <div class="card hover:shadow-lg transition-shadow">
              <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-gray-900">{{ class.name }}</h3>
                  @if (class.subject) {
                    <p class="text-gray-600 mt-1">{{ class.subject }}</p>
                  }
                  @if (class.academicYear) {
                    <p class="text-sm text-gray-500 mt-1">{{ class.academicYear }}</p>
                  }
                </div>
                <button
                  (click)="deleteClass(class.id)"
                  class="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
              <div class="mt-4 pt-4 border-t border-gray-200">
                <p class="text-sm text-gray-600">
                  <span class="font-medium">Created:</span> {{ class.createdAt | date:'short' }}
                </p>
              </div>
            </div>
          }
        </div>
      }

      <!-- Add Class Modal -->
      @if (showAddModal) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 class="text-2xl font-bold mb-4">Add New Class</h2>
            <form (submit)="addClass(); $event.preventDefault()">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Class Name *</label>
                  <input
                    type="text"
                    [(ngModel)]="newClass.name"
                    name="name"
                    placeholder="e.g., Computer Science 101"
                    class="input"
                    required
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    [(ngModel)]="newClass.subject"
                    name="subject"
                    placeholder="e.g., Programming"
                    class="input"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                  <input
                    type="text"
                    [(ngModel)]="newClass.academicYear"
                    name="academicYear"
                    placeholder="e.g., 2024-2025"
                    class="input"
                  />
                </div>
              </div>
              <div class="flex gap-3 mt-6">
                <button type="button" (click)="showAddModal = false" class="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary flex-1">
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ClassesComponent implements OnInit {
    private classService = inject(ClassService);

    classes = signal<Class[]>([]);
    loading = signal(false);
    showAddModal = false;

    newClass = {
        name: '',
        subject: '',
        academicYear: ''
    };

    ngOnInit(): void {
        this.loadClasses();
    }

    loadClasses(): void {
        this.loading.set(true);
        this.classService.getAll().subscribe({
            next: (classes) => {
                this.classes.set(classes);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    addClass(): void {
        if (!this.newClass.name) return;

        this.classService.create(this.newClass).subscribe({
            next: () => {
                this.showAddModal = false;
                this.newClass = { name: '', subject: '', academicYear: '' };
                this.loadClasses();
            }
        });
    }

    deleteClass(id: number): void {
        if (confirm('Are you sure you want to delete this class?')) {
            this.classService.delete(id).subscribe({
                next: () => this.loadClasses()
            });
        }
    }
}
