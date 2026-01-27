import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AttendanceRecord {
    studentId: number;
    status: 'present' | 'absent' | 'late' | 'excused';
}

@Injectable({
    providedIn: 'root'
})
export class AttendanceService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/attendance`;

    markAttendance(classId: number, date: string, records: AttendanceRecord[]): Observable<any> {
        return this.http.post(this.apiUrl, { classId, date, records });
    }

    getByDate(date: string, classId?: number): Observable<any[]> {
        const params: any = {};
        if (classId) params.classId = classId;
        return this.http.get<any[]>(`${this.apiUrl}/date/${date}`, { params });
    }

    getStudentAttendance(studentId: number, startDate?: string, endDate?: string): Observable<any[]> {
        const params: any = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return this.http.get<any[]>(`${this.apiUrl}/student/${studentId}`, { params });
    }

    getClassAttendanceRange(classId: number, startDate?: string, endDate?: string): Observable<any[]> {
        const params: any = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return this.http.get<any[]>(`${this.apiUrl}/class/${classId}/range`, { params });
    }
}
