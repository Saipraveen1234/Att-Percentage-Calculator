import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Student {
    id: number;
    rollNumber: string;
    name: string;
    email?: string;
    group?: string;
    classId: number;
    class?: any;
    createdAt: string;
    updatedAt: string;
}

export interface StudentListResponse {
    students: Student[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class StudentService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/students`;

    getAll(params?: { classId?: number; search?: string; page?: number; limit?: number }): Observable<StudentListResponse> {
        return this.http.get<StudentListResponse>(this.apiUrl, { params: params as any });
    }

    getById(id: number): Observable<Student> {
        return this.http.get<Student>(`${this.apiUrl}/${id}`);
    }

    create(student: Partial<Student>): Observable<Student> {
        return this.http.post<Student>(this.apiUrl, student);
    }

    update(id: number, student: Partial<Student>): Observable<Student> {
        return this.http.put<Student>(`${this.apiUrl}/${id}`, student);
    }

    delete(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }

    importFromFile(file: File, classId: number, group?: string): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('classId', classId.toString());
        if (group) formData.append('group', group);
        return this.http.post(`${this.apiUrl}/import`, formData);
    }
}
