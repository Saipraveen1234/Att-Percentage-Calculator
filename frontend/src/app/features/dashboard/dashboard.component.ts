import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassService, Class } from '../../core/services/class.service';
import { StudentService } from '../../core/services/student.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { ReportService } from '../../core/services/report.service';
import { AuthService } from '../../core/services/auth.service';
import { NgApexchartsModule, ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexStroke, ApexYAxis, ApexTitleSubtitle, ApexLegend, ApexFill, ApexTooltip, ApexGrid, ApexPlotOptions } from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  labels: string[];
  legend: ApexLegend;
  subtitle: ApexTitleSubtitle;
  fill: ApexFill;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Top header / Greeting -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div class="flex items-center gap-4">
          @if (currentUser$ | async; as user) {
            <div class="w-12 h-12 rounded-full bg-[#1B2028] flex items-center justify-center font-bold text-white shadow-md text-xl">
              {{ user.username?.charAt(0) | uppercase }}
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                Hello {{ user.username }}! <span class="text-2xl">👋</span>
              </h1>
              <p class="text-gray-500 text-sm mt-0.5">We hope you're having a great day.</p>
            </div>
          }
        </div>
        
        <div class="flex items-center gap-3">
          <select class="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#10B981] focus:border-[#10B981] block px-4 py-2.5 outline-none transition">
            <option>All Classes</option>
            @for (c of classes(); track c.id) {
              <option value="{{c.id}}">{{c.name}}</option>
            }
          </select>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <select class="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#10B981] focus:border-[#10B981] block pl-9 pr-6 py-2.5 outline-none transition appearance-none">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>This Semester</option>
            </select>
          </div>
          <button class="bg-[#10B981] hover:bg-[#0EA5E9] transition-colors text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            Filter
          </button>
        </div>
      </div>

      <!-- Stats Cards Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Card 1 -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
            </div>
            <div>
              <p class="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Students</p>
              <h3 class="text-2xl font-bold text-gray-900 leading-none">{{ stats().totalStudents }}</h3>
            </div>
          </div>
          <button class="text-gray-300 hover:text-gray-500"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/></svg></button>
        </div>

        <!-- Card 2 (Highlight Green) -->
        <div class="bg-gradient-to-br from-[#10B981] to-[#34D399] rounded-2xl p-6 shadow-sm border border-[#10B981]/20 flex items-center justify-between text-white hover:shadow-md transition transform hover:-translate-y-0.5">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </div>
            <div>
              <p class="text-emerald-50 text-xs font-semibold uppercase tracking-wider mb-1">Present Today</p>
              <h3 class="text-2xl font-bold leading-none">{{ stats().todayPresent }}</h3>
            </div>
          </div>
          <button class="text-emerald-200 hover:text-white"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/></svg></button>
        </div>

        <!-- Card 3 -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p class="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Absent Today</p>
              <h3 class="text-2xl font-bold text-gray-900 leading-none">{{ stats().todayAbsent }}</h3>
            </div>
          </div>
          <button class="bg-gray-800 text-xs text-white px-2.5 py-1 rounded shadow-sm hover:bg-black transition">View Details</button>
        </div>

        <!-- Card 4 -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p class="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Late Students Today</p>
              <h3 class="text-2xl font-bold text-gray-900 leading-none">{{ stats().todayLate }}</h3>
            </div>
          </div>
          <button class="text-gray-300 hover:text-gray-500"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/></svg></button>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Total Attendance Area Chart (Takes 2/3 width) -->
        <div class="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900">Total Attendance Report</h2>
            <button class="text-gray-300 hover:text-gray-500"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/></svg></button>
          </div>
          @if (lineChartOptions) {
            <div id="chart">
              <apx-chart
                [series]="lineChartOptions.series"
                [chart]="lineChartOptions.chart"
                [xaxis]="lineChartOptions.xaxis"
                [yaxis]="lineChartOptions.yaxis"
                [stroke]="lineChartOptions.stroke"
                [dataLabels]="lineChartOptions.dataLabels"
                [fill]="lineChartOptions.fill"
                [grid]="lineChartOptions.grid"
                [tooltip]="lineChartOptions.tooltip"
              ></apx-chart>
            </div>
          } @else {
            <div class="h-80 flex items-center justify-center text-gray-400"><div class="spinner border-4 border-[#10B981]/30 border-t-[#10B981] rounded-full w-8 h-8 animate-spin"></div></div>
          }
        </div>

        <!-- Students By Class Bar Chart (Takes 1/3 width) -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900">Students by Class</h2>
            <button class="text-gray-300 hover:text-gray-500"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/></svg></button>
          </div>
          @if (barChartOptions) {
            <div id="bar-chart">
              <apx-chart
                [series]="barChartOptions.series"
                [chart]="barChartOptions.chart"
                [plotOptions]="barChartOptions.plotOptions"
                [dataLabels]="barChartOptions.dataLabels"
                [xaxis]="barChartOptions.xaxis"
                [yaxis]="barChartOptions.yaxis"
                [fill]="barChartOptions.fill"
                [grid]="barChartOptions.grid"
                [tooltip]="barChartOptions.tooltip"
              ></apx-chart>
            </div>
          } @else {
            <div class="h-64 flex items-center justify-center text-gray-400"><div class="spinner border-4 border-[#10B981]/30 border-t-[#10B981] rounded-full w-8 h-8 animate-spin"></div></div>
          }
        </div>
        
        <!-- Weekly Absent Radar Chart (Half Width on large, full on small) -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-1">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-900">Weekly Absent</h2>
            <button class="text-gray-300 hover:text-gray-500"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/></svg></button>
          </div>
          @if (radarChartOptions) {
            <div id="radar-chart" class="flex justify-center">
              <apx-chart
                [series]="radarChartOptions.series"
                [chart]="radarChartOptions.chart"
                [xaxis]="radarChartOptions.xaxis"
                [stroke]="radarChartOptions.stroke"
                [fill]="radarChartOptions.fill"
                [dataLabels]="radarChartOptions.dataLabels"
              ></apx-chart>
            </div>
          } @else {
             <div class="h-64 flex items-center justify-center text-gray-400"><div class="spinner border-4 border-[#10B981]/30 border-t-[#10B981] rounded-full w-8 h-8 animate-spin"></div></div>
          }
        </div>

      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private classService = inject(ClassService);
  private studentService = inject(StudentService);
  private attendanceService = inject(AttendanceService);
  private reportService = inject(ReportService);
  private authService = inject(AuthService);

  currentUser$ = this.authService.currentUser$;
  classes = signal<Class[]>([]);

  // Stats state
  stats = signal({
    totalStudents: 0,
    todayPresent: 0,
    todayAbsent: 0,
    todayLate: 0
  });

  // Chart Configuration State
  public lineChartOptions: any;
  public barChartOptions: any;
  public radarChartOptions: any;

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.classService.getAll().subscribe({
      next: (classes) => {
        this.classes.set(classes);
        this.initBarChart(classes);
      }
    });

    this.studentService.getAll().subscribe({
      next: (response) => {
        this.stats.update(s => ({ ...s, totalStudents: response.pagination.total }));
        // Initialize mock line chart data to match UI since we don't have historical aggregation endpoint out-of-box
        this.initLineChart(response.pagination.total);
        this.initRadarChart();
      }
    });

    const today = new Date().toISOString().split('T')[0];
    this.attendanceService.getByDate(today).subscribe({
      next: (attendance) => {
        let present = 0; let absent = 0; let late = 0;
        attendance.forEach(a => {
          if (a.status === 'present') present++;
          else if (a.status === 'absent') absent++;
          else if (a.status === 'late') late++;
        });

        this.stats.update(s => ({
          ...s,
          todayPresent: present,
          todayAbsent: absent,
          todayLate: late
        }));
      }
    });
  }

  private initLineChart(total: number): void {
    // Mock data mirroring the image's smooth curve pattern over Jan
    const days = ['Jan 1', 'Jan 4', 'Jan 7', 'Jan 10', 'Jan 13', 'Jan 16', 'Jan 19', 'Jan 22', 'Jan 25', 'Jan 28'];
    const data = [42, 44.5, 42, 44, 44.5, 45, 44, 45.2, 47, 45.3, 43].map(v => Math.floor((v / 45) * (total || 45)));

    this.lineChartOptions = {
      series: [{
        name: "Present Students",
        data: data
      }],
      chart: {
        height: 350,
        type: "area",
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif',
        zoom: { enabled: false }
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3, colors: ["#10B981"] },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 90, 100],
          colorStops: [
            { offset: 0, color: "#10B981", opacity: 0.4 },
            { offset: 100, color: "#10B981", opacity: 0.01 }
          ]
        }
      },
      xaxis: {
        categories: days,
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
        labels: { style: { colors: '#9CA3AF' } }
      },
      yaxis: {
        labels: { style: { colors: '#9CA3AF' } }
      },
      grid: {
        borderColor: '#F3F4F6',
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } }
      },
      tooltip: {
        theme: 'light',
        marker: { show: false }
      }
    };
  }

  private initBarChart(classes: Class[]): void {
    // Create chart based on actual classes
    const classNames = classes.map(c => c.name.length > 3 ? c.name.substring(0, 3) : c.name);

    // Mock random student counts per class for aesthetics if backend doesn't provide them easily
    const studentCounts = classes.map(() => Math.floor(Math.random() * 15) + 10);

    this.barChartOptions = {
      series: [{
        name: "Students",
        data: studentCounts
      }],
      chart: {
        height: 320,
        type: "bar",
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif',
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '40%',
          distributed: true,
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: classNames,
        labels: { style: { colors: '#9CA3AF', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        labels: { style: { colors: '#9CA3AF' } }
      },
      fill: {
        colors: studentCounts.map((_, i) => i === 3 ? '#10B981' : '#E5E7EB'), // Highlight one column like image
        opacity: 1
      },
      grid: {
        borderColor: '#F3F4F6',
        strokeDashArray: 0,
        yaxis: { lines: { show: false } },
        xaxis: { lines: { show: false } }
      },
      tooltip: { theme: 'light' }
    };
  }

  private initRadarChart(): void {
    this.radarChartOptions = {
      series: [{
        name: "Absent",
        data: [8, 6, 2, 3, 5, 2, 4]
      }],
      chart: {
        height: 300,
        type: "radar",
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif',
      },
      stroke: { width: 2, colors: ['#10B981'] },
      fill: { opacity: 0.3, colors: ['#10B981'] },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        labels: {
          style: {
            colors: ['#6B7280', '#6B7280', '#6B7280', '#6B7280', '#6B7280', '#6B7280', '#6B7280'],
            fontSize: '12px'
          }
        }
      },
      dataLabels: { enabled: false }
    };
  }
}
