import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExamMark {
    id: number;
    studentId: number;
    classId: number;
    semester: string; // 'semester1' or 'semester2'
    examType: string; // 'mid1' or 'mid2'
    marks: number;
    academicYear: string;
    markedBy: number;
    createdAt: string;
    updatedAt: string;
    student?: {
        id: number;
        name: string;
        rollNumber: string;
    };
    class?: {
        id: number;
        name: string;
        subject: string;
    };
}

export interface ExamMarkStats {
    totalStudents: number;
    averageMarks: number;
    highestMarks: number;
    lowestMarks: number;
    passCount: number;
    failCount: number;
    passPercentage: number;
    studentResults?: Array<{
        student: {
            id: number;
            name: string;
            rollNumber: string;
        };
        semester: string;
        academicYear: string;
        average: number;
        status: string;
    }>;
}

@Injectable({
    providedIn: 'root'
})
export class ExamMarkService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/exam-marks`;

    createExamMark(data: {
        studentId: number;
        classId: number;
        semester: string;
        examType: string;
        marks: number;
        academicYear: string;
    }): Observable<{ message: string; examMark: ExamMark }> {
        return this.http.post<{ message: string; examMark: ExamMark }>(this.apiUrl, data);
    }

    updateExamMark(id: number, marks: number): Observable<{ message: string; examMark: ExamMark }> {
        return this.http.put<{ message: string; examMark: ExamMark }>(`${this.apiUrl}/${id}`, { marks });
    }

    deleteExamMark(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }

    getExamMarksByStudent(
        studentId: number,
        filters?: { academicYear?: string; semester?: string }
    ): Observable<ExamMark[]> {
        let params = new HttpParams();
        if (filters?.academicYear) {
            params = params.set('academicYear', filters.academicYear);
        }
        if (filters?.semester) {
            params = params.set('semester', filters.semester);
        }
        return this.http.get<ExamMark[]>(`${this.apiUrl}/student/${studentId}`, { params });
    }

    getExamMarksByClass(
        classId: number,
        filters?: { academicYear?: string; semester?: string; examType?: string }
    ): Observable<ExamMark[]> {
        let params = new HttpParams();
        if (filters?.academicYear) {
            params = params.set('academicYear', filters.academicYear);
        }
        if (filters?.semester) {
            params = params.set('semester', filters.semester);
        }
        if (filters?.examType) {
            params = params.set('examType', filters.examType);
        }
        return this.http.get<ExamMark[]>(`${this.apiUrl}/class/${classId}`, { params });
    }

    getExamMarkStats(
        classId: number,
        filters?: { academicYear?: string; semester?: string }
    ): Observable<ExamMarkStats> {
        let params = new HttpParams();
        if (filters?.academicYear) {
            params = params.set('academicYear', filters.academicYear);
        }
        if (filters?.semester) {
            params = params.set('semester', filters.semester);
        }
        return this.http.get<ExamMarkStats>(`${this.apiUrl}/class/${classId}/stats`, { params });
    }

    processMarkSheetOCR(formData: FormData): Observable<{
        success: boolean;
        data: Array<{ rollNumber: string; marks: number }>;
        count: number;
    }> {
        return this.http.post<{
            success: boolean;
            data: Array<{ rollNumber: string; marks: number }>;
            count: number;
        }>(`${this.apiUrl}/ocr`, formData);
    }
}
