import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Class {
    id: number;
    name: string;
    subject?: string;
    academicYear?: string;
    teacherId: number;
    teacher?: any;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class ClassService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/classes`;

    getAll(): Observable<Class[]> {
        return this.http.get<Class[]>(this.apiUrl);
    }

    getById(id: number): Observable<Class> {
        return this.http.get<Class>(`${this.apiUrl}/${id}`);
    }

    create(classData: Partial<Class>): Observable<Class> {
        return this.http.post<Class>(this.apiUrl, classData);
    }

    update(id: number, classData: Partial<Class>): Observable<Class> {
        return this.http.put<Class>(`${this.apiUrl}/${id}`, classData);
    }

    delete(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }
}
