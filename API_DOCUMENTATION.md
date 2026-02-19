# School Management System API - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Error Handling](#error-handling)
5. [Database Schema](#database-schema)
6. [Role-Based Access Control](#role-based-access-control)

---

## Overview

The School Management System API is a comprehensive RESTful API built with Express.js and MongoDB that enables superadmins to manage schools, school administrators to manage classrooms and students, and provides complete enrollment and academic tracking capabilities.

### Key Features
- JWT-based authentication
- Role-based access control (RBAC)
- Complete CRUD operations for Schools, Classrooms, and Students
- Student enrollment, transfer, and attendance tracking
- Marks management
- Caching for improved performance
- Comprehensive input validation

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcrypt
- **Caching**: Redis (via ion-cortex)

---

## Authentication

### Token Structure
The system uses two types of JWT tokens:

1. **Long Token** (3 years expiry)
   - Contains: userId, userKey, role, schoolId
   - Used for obtaining short tokens
   - Stored securely on client

2. **Short Token** (1 year expiry)
   - Contains: userId, userKey, sessionId, deviceId
   - Used for API requests
   - Tied to specific device

### Header Format
All protected endpoints require the token in the request header:

```
Authorization: Bearer <short_token>
```

Or alternatively:

```
token: <short_token>
```

### Authentication Flow

```
1. User Registration/Login
   ↓
2. System generates Long Token (3 years)
   ↓
3. Client uses Long Token to request Short Token
   ↓
4. Short Token issued (1 year, device-specific)
   ↓
5. Use Short Token for all API requests
   ↓
6. Automatic refresh or manual re-authentication when expired
```

---

## API Endpoints

### Base URL
```
http://localhost:30100/api
```

### Request Format
All requests follow the pattern:
```
POST/GET/PUT/DELETE /api/{moduleName}/{functionName}
```

---

## Authentication Endpoints

### 1. Register Superadmin
**Endpoint**: `POST /api/auth/registerSuperAdmin`
**Authorization**: Public (only for initial setup)
**Description**: Creates the first superadmin user. Only works if no superadmin exists.

**Request Body**:
```json
{
  "username": "superadmin",
  "email": "admin@school.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```

**Success Response** (201):
```json
{
  "ok": true,
  "code": 201,
  "data": {
    "user": {
      "_id": "user_123",
      "username": "superadmin",
      "email": "admin@school.com",
      "role": "superadmin",
      "isActive": true,
      "createdAt": "2024-02-18T10:00:00Z"
    },
    "longToken": "eyJhbGc...",
    "message": "Superadmin registered successfully"
  }
}
```

**Error Responses**:
- `400`: Passwords don't match or superadmin already exists
- `500`: Server error

---

### 2. Register School Admin
**Endpoint**: `POST /api/auth/registerSchoolAdmin`
**Authorization**: Superadmin only
**Description**: Creates a new school administrator account.

**Headers**:
```
token: <superadmin_long_token>
```

**Request Body**:
```json
{
  "username": "admin_school1",
  "email": "admin@school1.edu",
  "password": "AdminPassword123!",
  "confirmPassword": "AdminPassword123!",
  "schoolId": "school_123"
}
```

**Success Response** (201):
```json
{
  "ok": true,
  "code": 201,
  "data": {
    "user": {
      "_id": "admin_user_id",
      "username": "admin_school1",
      "email": "admin@school1.edu",
      "role": "school_admin",
      "schoolId": "school_123",
      "isActive": true
    },
    "longToken": "eyJhbGc...",
    "message": "School admin created successfully"
  }
}
```

**Error Responses**:
- `400`: Invalid input or user already exists
- `403`: Unauthorized (only superadmin)
- `404`: School not found

---

### 3. Login
**Endpoint**: `POST /api/auth/login`
**Authorization**: Public
**Description**: Authenticates a user and returns tokens.

**Request Body**:
```json
{
  "username": "superadmin",
  "password": "SecurePassword123!"
}
```

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "user": {
      "_id": "user_123",
      "username": "superadmin",
      "email": "admin@school.com",
      "role": "superadmin",
      "lastLogin": "2024-02-18T10:15:30Z"
    },
    "longToken": "eyJhbGc...",
    "message": "Login successful"
  }
}
```

**Error Responses**:
- `400`: Missing credentials
- `401`: Invalid username/password or inactive user

---

### 4. Get Profile
**Endpoint**: `GET /api/auth/getProfile`
**Authorization**: Authenticated users (all roles)
**Description**: Retrieves the current user's profile information.

**Headers**:
```
token: <valid_token>
```

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "user": {
      "_id": "user_123",
      "username": "superadmin",
      "email": "admin@school.com",
      "role": "superadmin",
      "createdAt": "2024-02-18T10:00:00Z",
      "updatedAt": "2024-02-18T10:15:30Z"
    }
  }
}
```

---

### 5. Update Profile
**Endpoint**: `PUT /api/auth/updateProfile`
**Authorization**: Authenticated users
**Description**: Updates user profile information (username, email).

**Request Body**:
```json
{
  "username": "newusername",
  "email": "newemail@school.com"
}
```

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "user": { /* updated user object */ },
    "message": "Profile updated successfully"
  }
}
```

---

### 6. Change Password
**Endpoint**: `PUT /api/auth/changePassword`
**Authorization**: Authenticated users
**Description**: Changes user password.

**Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "message": "Password changed successfully"
  }
}
```

**Error Responses**:
- `400`: Passwords don't match
- `401`: Current password is incorrect

---

## School Management Endpoints

### 1. Create School
**Endpoint**: `POST /api/school/createSchool`
**Authorization**: Superadmin only
**Description**: Creates a new school and assigns an administrator.

**Request Body**:
```json
{
  "name": "Lincoln High School",
  "description": "A leading educational institution",
  "address": "123 Education Lane",
  "city": "Springfield",
  "state": "Illinois",
  "zipCode": "62701",
  "phone": "2175551234",
  "email": "info@lincolnhs.edu",
  "adminId": "admin_user_id",
  "academicYear": "2024-2025"
}
```

**Success Response** (201):
```json
{
  "ok": true,
  "code": 201,
  "data": {
    "school": {
      "_id": "school_123",
      "name": "Lincoln High School",
      "address": "123 Education Lane",
      "city": "Springfield",
      "state": "Illinois",
      "zipCode": "62701",
      "phone": "2175551234",
      "email": "info@lincolnhs.edu",
      "adminId": "admin_user_id",
      "totalStudents": 0,
      "totalClassrooms": 0,
      "academicYear": "2024-2025",
      "isActive": true,
      "createdAt": "2024-02-18T10:00:00Z"
    },
    "message": "School created successfully"
  }
}
```

**Error Responses**:
- `400`: Invalid input or validation error
- `403`: Unauthorized (only superadmin)
- `404`: Admin user not found
- `500`: Server error

---

### 2. Get School by ID
**Endpoint**: `GET /api/school/getSchoolById?schoolId=school_123`
**Authorization**: Public (returns cached data)
**Description**: Retrieves school details by ID.

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "_id": "school_123",
    "name": "Lincoln High School",
    "address": "123 Education Lane",
    "city": "Springfield",
    "totalStudents": 150,
    "totalClassrooms": 10
  }
}
```

**Error Responses**:
- `404`: School not found

---

### 3. Get All Schools
**Endpoint**: `GET /api/school/getAllSchools?page=1&limit=10`
**Authorization**: Superadmin only
**Description**: Retrieves all schools with pagination.

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "schools": [ /* array of school objects */ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

### 4. Update School
**Endpoint**: `PUT /api/school/updateSchool`
**Authorization**: Superadmin or assigned School Admin
**Description**: Updates school information.

**Request Body**:
```json
{
  "schoolId": "school_123",
  "name": "Lincoln High School - Updated",
  "phone": "2175559999",
  "email": "newemail@lincolnhs.edu"
}
```

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "school": { /* updated school object */ },
    "message": "School updated successfully"
  }
}
```

---

### 5. Delete School
**Endpoint**: `DELETE /api/school/deleteSchool`
**Authorization**: Superadmin only
**Description**: Soft deletes a school (marks as inactive).

**Request Body**:
```json
{
  "schoolId": "school_123"
}
```

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "message": "School deleted successfully"
  }
}
```

---

## Classroom Management Endpoints

### 1. Create Classroom
**Endpoint**: `POST /api/classroom/createClassroom`
**Authorization**: School Admin (of the school)
**Description**: Creates a new classroom in a school.

**Request Body**:
```json
{
  "schoolId": "school_123",
  "name": "Class 10-A",
  "grade": "10",
  "section": "A",
  "capacity": 40,
  "room": "Room 101",
  "academicYear": "2024-2025",
  "teacherId": "teacher_123"
}
```

**Validation Rules**:
- `grade`: Must be one of: K, 1-12
- `section`: Must be one of: A, B, C, D, E, F
- `capacity`: Must be between 1 and 100
- `academicYear`: Format YYYY-YYYY

**Success Response** (201):
```json
{
  "ok": true,
  "code": 201,
  "data": {
    "classroom": {
      "_id": "classroom_123",
      "name": "Class 10-A",
      "grade": "10",
      "section": "A",
      "capacity": 40,
      "currentEnrollment": 0,
      "room": "Room 101",
      "schoolId": "school_123",
      "academicYear": "2024-2025",
      "isActive": true
    },
    "message": "Classroom created successfully"
  }
}
```

---

### 2. Get Classroom by ID
**Endpoint**: `GET /api/classroom/getClassroomById?classroomId=classroom_123`
**Authorization**: Authenticated (School Admin of same school)
**Description**: Retrieves classroom details.

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "_id": "classroom_123",
    "name": "Class 10-A",
    "grade": "10",
    "section": "A",
    "capacity": 40,
    "currentEnrollment": 25,
    "maxCapacityReached": false
  }
}
```

---

### 3. Get School Classrooms
**Endpoint**: `GET /api/classroom/getSchoolClassrooms?schoolId=school_123&grade=10`
**Authorization**: School Admin or Superadmin
**Description**: Retrieves all classrooms of a school with optional filtering.

**Query Parameters**:
- `schoolId` (required): School ID
- `grade` (optional): Filter by grade
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "classrooms": [ /* array of classroom objects */ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 12,
      "pages": 2
    }
  }
}
```

---

### 4. Update Classroom
**Endpoint**: `PUT /api/classroom/updateClassroom`
**Authorization**: School Admin of the school
**Description**: Updates classroom information.

**Request Body**:
```json
{
  "classroomId": "classroom_123",
  "name": "Class 10-A (Updated)",
  "capacity": 45,
  "teacherId": "teacher_456"
}
```

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "classroom": { /* updated classroom object */ },
    "message": "Classroom updated successfully"
  }
}
```

---

### 5. Get Classroom Students
**Endpoint**: `GET /api/classroom/getClassroomStudents?classroomId=classroom_123`
**Authorization**: School Admin or Superadmin
**Description**: Retrieves all students in a classroom.

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "classroomId": "classroom_123",
    "classroomName": "Class 10-A",
    "totalEnrolled": 25,
    "capacity": 40,
    "availableSeats": 15,
    "students": [ /* array of student objects */ ]
  }
}
```

---

### 6. Add Resource to Classroom
**Endpoint**: `POST /api/classroom/addResourceToClassroom`
**Authorization**: School Admin
**Description**: Adds a resource (equipment, materials) to a classroom.

**Request Body**:
```json
{
  "classroomId": "classroom_123",
  "name": "Projector",
  "quantity": 1,
  "condition": "good"
}
```

**Condition Values**: good, fair, poor

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "classroom": { /* updated classroom with resources */ },
    "message": "Resource added successfully"
  }
}
```

---

### 7. Update Classroom Capacity
**Endpoint**: `PUT /api/classroom/updateClassroomCapacity`
**Authorization**: School Admin
**Description**: Updates classroom capacity.

**Request Body**:
```json
{
  "classroomId": "classroom_123",
  "newCapacity": 50
}
```

**Validation**: newCapacity must be >= currentEnrollment

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "classroom": { /* updated classroom object */ },
    "message": "Capacity updated successfully"
  }
}
```

---

## Student Management Endpoints

### 1. Enroll Student
**Endpoint**: `POST /api/student/enrollStudent`
**Authorization**: School Admin of the school
**Description**: Enrolls a new student in a classroom.

**Request Body**:
```json
{
  "schoolId": "school_123",
  "classroomId": "classroom_123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "2010-05-15",
  "gender": "male",
  "parentName": "Jane Doe",
  "parentPhone": "2175551234",
  "parentEmail": "parent@email.com",
  "address": "456 Student Street",
  "academicYear": "2024-2025"
}
```

**Validation Rules**:
- `firstName`, `lastName`: 2-50 characters
- `gender`: male, female, other
- `dateOfBirth`: Valid date string
- `parentPhone`: 10-15 digits
- `parentEmail`: Valid email format

**Success Response** (201):
```json
{
  "ok": true,
  "code": 201,
  "data": {
    "student": {
      "_id": "student_123",
      "firstName": "John",
      "lastName": "Doe",
      "schoolId": "school_123",
      "classroomId": "classroom_123",
      "rollNumber": "1",
      "admissionNumber": "SCHOOL-2024-ABC123",
      "enrollmentStatus": "active",
      "admissionDate": "2024-02-18T10:00:00Z"
    },
    "message": "Student enrolled successfully"
  }
}
```

**Error Responses**:
- `400`: Classroom at full capacity or invalid input
- `404`: School or classroom not found

---

### 2. Get Student by ID
**Endpoint**: `GET /api/student/getStudentById?studentId=student_123`
**Authorization**: School Admin or Superadmin
**Description**: Retrieves student details by ID.

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "_id": "student_123",
    "firstName": "John",
    "lastName": "Doe",
    "schoolId": "school_123",
    "classroomId": "classroom_123",
    "rollNumber": "1",
    "admissionNumber": "SCHOOL-2024-ABC123",
    "attendance": {
      "present": 45,
      "absent": 2,
      "leave": 1
    },
    "enrollmentStatus": "active"
  }
}
```

---

### 3. Get Students by School
**Endpoint**: `GET /api/student/getStudentsBySchool?schoolId=school_123&page=1&limit=20`
**Authorization**: School Admin or Superadmin
**Description**: Retrieves all students in a school with pagination.

**Query Parameters**:
- `schoolId` (required): School ID
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "students": [ /* array of student objects */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

---

### 4. Get Students by Classroom
**Endpoint**: `GET /api/student/getStudentsByClassroom?classroomId=classroom_123`
**Authorization**: School Admin or Superadmin
**Description**: Retrieves all students in a specific classroom.

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "classroomId": "classroom_123",
    "classroomName": "Class 10-A",
    "totalEnrolled": 25,
    "students": [ /* array of student objects */ ]
  }
}
```

---

### 5. Update Student
**Endpoint**: `PUT /api/student/updateStudent`
**Authorization**: School Admin
**Description**: Updates student information.

**Request Body**:
```json
{
  "studentId": "student_123",
  "firstName": "Jonathan",
  "lastName": "Doe",
  "parentPhone": "2175559999",
  "address": "789 New Street"
}
```

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "student": { /* updated student object */ },
    "message": "Student updated successfully"
  }
}
```

---

### 6. Transfer Student
**Endpoint**: `PUT /api/student/transferStudent`
**Authorization**: School Admin
**Description**: Transfers a student to another classroom.

**Request Body**:
```json
{
  "studentId": "student_123",
  "newClassroomId": "classroom_456",
  "reason": "Academic promotion"
}
```

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "student": {
      "_id": "student_123",
      "classroomId": "classroom_456",
      "enrollmentStatus": "transferred",
      "transferHistory": [
        {
          "fromClassroom": "classroom_123",
          "toClassroom": "classroom_456",
          "transferDate": "2024-02-18T10:30:00Z",
          "reason": "Academic promotion"
        }
      ]
    },
    "message": "Student transferred successfully"
  }
}
```

**Error Responses**:
- `400`: New classroom at capacity or invalid input
- `404`: Student or classroom not found

---

### 7. Update Attendance
**Endpoint**: `PUT /api/student/updateAttendance`
**Authorization**: School Admin
**Description**: Updates student daily attendance.

**Request Body**:
```json
{
  "studentId": "student_123",
  "status": "present"
}
```

**Status Values**: present, absent, leave

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "student": {
      "_id": "student_123",
      "attendance": {
        "present": 46,
        "absent": 2,
        "leave": 1
      }
    },
    "message": "Attendance updated successfully"
  }
}
```

**Error Responses**:
- `400`: Invalid status value
- `404`: Student not found

---

### 8. Add Marks
**Endpoint**: `POST /api/student/addMarks`
**Authorization**: School Admin
**Description**: Adds marks for a student in a subject.

**Request Body**:
```json
{
  "studentId": "student_123",
  "subject": "Mathematics",
  "score": 85
}
```

**Validation**: Score must be between 0 and 100

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "student": {
      "_id": "student_123",
      "marks": [
        {
          "subject": "Mathematics",
          "score": 85,
          "date": "2024-02-18T10:45:00Z"
        }
      ]
    },
    "message": "Marks added successfully"
  }
}
```

---

### 9. Get Student Marks
**Endpoint**: `GET /api/student/getStudentMarks?studentId=student_123`
**Authorization**: School Admin or Superadmin
**Description**: Retrieves all marks for a student.

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "studentId": "student_123",
    "marks": [
      {
        "subject": "Mathematics",
        "score": 85,
        "date": "2024-02-18T10:45:00Z"
      },
      {
        "subject": "English",
        "score": 92,
        "date": "2024-02-18T11:00:00Z"
      }
    ]
  }
}
```

---

### 10. Deactivate Student
**Endpoint**: `DELETE /api/student/deactivateStudent`
**Authorization**: School Admin
**Description**: Deactivates a student (marks as inactive).

**Request Body**:
```json
{
  "studentId": "student_123",
  "reason": "graduated"
}
```

**Reason Values**: graduated, dropped, other

**Success Response** (200):
```json
{
  "ok": true,
  "code": 200,
  "data": {
    "message": "Student deactivated successfully"
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "ok": false,
  "code": 400,
  "errors": "Descriptive error message"
}
```

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Successfully retrieved or updated |
| 201 | Created | Successfully created new resource |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected server error |

### Validation Error Example
```json
{
  "ok": false,
  "code": 400,
  "errors": "School name must be between 3 and 100 characters"
}
```

---

## Role-Based Access Control (RBAC)

### User Roles

#### 1. Superadmin
- **Permissions**: 
  - Create, read, update, delete schools
  - View all schools and students
  - Create school administrators
  - Full system access

- **Restrictions**: None

#### 2. School Admin
- **Permissions**:
  - Manage their assigned school
  - Create, read, update, delete classrooms
  - Enroll, transfer, and manage students
  - View student marks and attendance
  - Create student accounts
  - Add classroom resources

- **Restrictions**:
  - Limited to their assigned school only
  - Cannot view other schools
  - Cannot create new schools

#### 3. Student
- **Permissions**:
  - View own profile
  - View own marks and attendance

- **Restrictions**:
  - Cannot create or modify any records
  - Read-only access to own data
  - Cannot access other students' data

---

## Database Schema

### Collections Structure

#### Users Collection
```javascript
{
  _id: String (nanoid),
  username: String,
  email: String,
  password: String (bcrypt hashed),
  role: String (superadmin | school_admin | student),
  schoolId: String (ref: School),
  studentId: String (ref: Student),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Schools Collection
```javascript
{
  _id: String (nanoid),
  name: String,
  description: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  phone: String,
  email: String,
  adminId: String (ref: User),
  totalStudents: Number,
  totalClassrooms: Number,
  academicYear: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Classrooms Collection
```javascript
{
  _id: String (nanoid),
  name: String,
  grade: String,
  section: String,
  schoolId: String (ref: School),
  teacherId: String,
  capacity: Number,
  currentEnrollment: Number,
  room: String,
  academicYear: String,
  resources: [{
    name: String,
    quantity: Number,
    condition: String
  }],
  schedule: {
    startTime: String,
    endTime: String,
    days: [String]
  },
  maxCapacityReached: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Students Collection
```javascript
{
  _id: String (nanoid),
  firstName: String,
  lastName: String,
  schoolId: String (ref: School),
  classroomId: String (ref: Classroom),
  rollNumber: String,
  dateOfBirth: Date,
  gender: String,
  parentName: String,
  parentPhone: String,
  parentEmail: String,
  address: String,
  admissionNumber: String,
  admissionDate: Date,
  academicYear: String,
  attendance: {
    present: Number,
    absent: Number,
    leave: Number
  },
  marks: [{
    subject: String,
    score: Number,
    date: Date
  }],
  enrollmentStatus: String,
  transferHistory: [{
    fromClassroom: String,
    toClassroom: String,
    transferDate: Date,
    reason: String
  }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Example Usage Scenarios

### Scenario 1: Setting up a new school

```bash
# 1. Register superadmin
POST /api/auth/registerSuperAdmin
{
  "username": "super_admin",
  "email": "admin@system.com",
  "password": "SecureP@ss123",
  "confirmPassword": "SecureP@ss123"
}

# 2. Login as superadmin
POST /api/auth/login
{
  "username": "super_admin",
  "password": "SecureP@ss123"
}

# 3. Register school admin
POST /api/auth/registerSchoolAdmin
Headers: token: <superadmin_token>
{
  "username": "lincoln_admin",
  "email": "admin@lincoln.edu",
  "password": "AdminP@ss123",
  "confirmPassword": "AdminP@ss123",
  "schoolId": "school_123"
}

# 4. Create school
POST /api/school/createSchool
Headers: token: <superadmin_token>
{...school details...}
```

### Scenario 2: Enrolling a student

```bash
# 1. Login as school admin
POST /api/auth/login
{
  "username": "lincoln_admin",
  "password": "AdminP@ss123"
}

# 2. Create classroom
POST /api/classroom/createClassroom
Headers: token: <school_admin_token>
{...classroom details...}

# 3. Enroll student
POST /api/student/enrollStudent
Headers: token: <school_admin_token>
{...student details...}

# 4. Record attendance
PUT /api/student/updateAttendance
Headers: token: <school_admin_token>
{
  "studentId": "student_123",
  "status": "present"
}

# 5. Add marks
POST /api/student/addMarks
Headers: token: <school_admin_token>
{
  "studentId": "student_123",
  "subject": "Mathematics",
  "score": 85
}
```

---

## Rate Limiting and Security

- **CORS**: Enabled for all origins (configurable)
- **Password Security**: bcrypt with salt rounds 10
- **Token Expiration**:
  - Long tokens: 3 years
  - Short tokens: 1 year
- **Session Management**: Cache-based with Redis
- **Input Validation**: All inputs validated using schema validators

---

## Support and Contact

For issues or questions:
- Review this documentation
- Check test suite for implementation examples
- Review error codes and validation rules
- Contact: support@school-management-system.com

---

**API Version**: 1.0.0
**Last Updated**: February 18, 2024
