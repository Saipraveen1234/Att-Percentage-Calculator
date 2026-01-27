import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/reports`;

    getStudentPercentage(studentId: number, classId?: number, startDate?: string, endDate?: string): Observable<any> {
        const params: any = {};
        if (classId) params.classId = classId;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return this.http.get(`${this.apiUrl}/student/${studentId}/percentage`, { params });
    }

    getClassSummary(classId: number, startDate?: string, endDate?: string): Observable<any> {
        const params: any = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return this.http.get(`${this.apiUrl}/class/${classId}/summary`, { params });
    }

    exportCSV(classId: number, startDate?: string, endDate?: string): Observable<Blob> {
        const params: any = { classId };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return this.http.get(`${this.apiUrl}/export/csv`, {
            params,
            responseType: 'blob'
        });
    }

    getAnalytics(classId: number, startDate?: string, endDate?: string): Observable<any> {
        const params: any = { classId };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return this.http.get(`${this.apiUrl}/analytics`, { params });
    }
}
