# Attendance Percentage Calculator - Backend

Backend API for the Attendance Tracking System built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- 🔐 JWT Authentication (Register/Login)
- 👥 Student Management (CRUD operations)
- 📚 Class/Subject Management
- ✅ Attendance Marking (Bulk operations)
- 📊 Automatic Percentage Calculation
- 📈 Reports and Analytics
- 📁 **Bulk CSV/Excel Import** for students
- 📤 CSV Export for attendance reports

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/attendance_db?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
PORT=5000
FRONTEND_URL=http://localhost:4200
```

### 3. Set Up Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

### Students
- `GET /api/students` - Get all students (with pagination & search)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/import` - **Bulk import from CSV/Excel**

### Classes
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create new class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Attendance
- `POST /api/attendance` - Mark attendance (bulk)
- `GET /api/attendance/date/:date` - Get attendance for specific date
- `GET /api/attendance/student/:id` - Get student's attendance history
- `PUT /api/attendance/:id` - Update attendance record
- `GET /api/attendance/class/:classId/range` - Get attendance for date range

### Reports
- `GET /api/reports/student/:id/percentage` - Get student attendance %
- `GET /api/reports/class/:id/summary` - Get class attendance summary
- `GET /api/reports/export/csv` - Export attendance as CSV
- `GET /api/reports/analytics` - Get attendance analytics

## CSV Import Format

For bulk student import, use this CSV format:

```csv
Roll Number,Name,Email
001,John Doe,john@example.com
002,Jane Smith,jane@example.com
003,Mike Johnson,mike@example.com
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, validation
│   ├── utils/           # Helper functions
│   └── server.ts        # Express app
├── prisma/
│   └── schema.prisma    # Database schema
├── uploads/             # Temporary file uploads
└── dist/                # Compiled JavaScript
```

## Development

- TypeScript files are in `src/`
- Nodemon watches for changes and auto-restarts
- Prisma Client is auto-generated from schema

## License

ISC
