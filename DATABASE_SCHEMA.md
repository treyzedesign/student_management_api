# Database Schema Design - School Management System

## Schema Overview

The School Management System uses MongoDB with four main collections: Users, Schools, Classrooms, and Students. The system implements a **two-step enrollment process** where users are created first, then linked to student profiles during enrollment.

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────────────────┐
│         Users               │
├─────────────────────────────┤
│ _id (PK)                    │
│ username                    │
│ email                       │
│ password                    │
│ role (superadmin,           │
│       school_admin,         │
│       student)              │
│ schoolId (FK) ◄─────────────┼───────┐
│ isActive                    │       │
│ lastLogin                   │       │
│ createdAt                   │       │
│ updatedAt                   │       │
└──────────┬────────────────────────┘
           │
           │ (1:1 via userId)
           │
           ▼
┌──────────────────────────────────┐
│       Students                   │
├──────────────────────────────────┤
│ _id (uses userId)                │
│ userId (FK) → User._id           │
│ firstName                        │
│ lastName                         │
│ schoolId (FK)   ◄────┐          │
│ classroomId(FK) ◄───┐│          │
│ rollNumber           ││          │
│ dateOfBirth          ││          │
│ gender               ││          │
│ parentName           ││          │
│ parentPhone          ││          │
│ parentEmail          ││          │
│ address              ││          │
│ admissionNumber      ││          │
│ academicYear         ││          │
│ attendance           ││          │
│ marks                ││          │
│ enrollmentStatus     ││          │
│ transferHistory      ││          │
│ isActive             ││          │
│ createdAt            ││          │
│ updatedAt            ││          │
└──────────────────────┼┼──────────┘
                       ││
        ┌──────────────┘│
        │               │
        ▼               ▼
┌──────────────────┐ ┌──────────────────┐
│     Schools      │ │    Classrooms    │
├──────────────────┤ ├──────────────────┤
│ _id (PK)         │ │ _id (PK)         │
│ name             │ │ name             │
│ description      │ │ grade            │
│ address          │ │ section          │
│ city             │ │ schoolId (FK)    │
│ state            │ │ teacherId        │
│ zipCode          │ │ capacity         │
│ phone            │ │ currentEnr.      │
│ email            │ │ room             │
│ adminId (FK)─┐   │ │ academicYear     │
│              │   │ │ resources        │
│ totalStudents│   │ │ schedule         │
│ totalClassr. │   │ │ maxCapacityReached
│ academicYear │   │ │ isActive         │
│ isActive     │   │ │ createdAt        │
│ createdAt    │   │ │ updatedAt        │
│ updatedAt    │   │ └──────────────────┘
└──────────┬───────┘
           │
           │ (Admin User)
           │
           ▼
        User (school_admin)

RELATIONSHIPS:
- User → School (1:M via adminId) - School Admin manages one school
- User ↔ Student (1:1 via userId) - User account linked to student profile [NEW]
- School → Classroom (1:M via schoolId)
- School → Student (1:M via schoolId)
- Classroom → Student (1:M via classroomId)
```

---

## Enrollment Flow

```
┌─────────────────────────────────────────────┐
│ STEP 1: Register Student User (Auth)        │
├─────────────────────────────────────────────┤
│ POST /api/auth/registerStudentUser          │
│                                             │
│ Input:                                      │
│  - username                                 │
│  - email                                    │
│  - password                                 │
│  - confirmPassword                          │
│                                             │
│ Creates: User document with role='student' │
│ Returns: userId, username, email,          │
│          longToken                         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ STEP 2: Enroll Student (Student Manager)    │
├─────────────────────────────────────────────┤
│ POST /api/student/enrollStudent             │
│                                             │
│ Input:                                      │
│  - userId (from Step 1)                    │
│  - schoolId                                 │
│  - classroomId                              │
│  - firstName, lastName                      │
│  - dateOfBirth, gender                      │
│  - parentName, parentPhone, parentEmail     │
│  - address, academicYear                    │
│                                             │
│ Actions:                                    │
│  1. Update User with schoolId               │
│  2. Create Student doc with userId as _id   │
│  3. Update Classroom enrollment count       │
│  4. Update School student count             │
│  5. Cache student profile                   │
│                                             │
│ Returns: Student profile with               │
│          admissionNumber, rollNumber        │
└─────────────────────────────────────────────┘
```

---

## Detailed Collection Schemas

### 1. Users Collection

**Purpose**: Store user authentication and profile information for all user types (superadmin, school_admin, student)

```javascript
{
  _id: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(),
    description: "Unique user identifier (nanoid)"
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
    description: "Unique username for login authentication"
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    description: "User's email address"
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
    description: "Bcrypt hashed password (not returned in responses)"
  },
  role: {
    type: String,
    enum: ['superadmin', 'school_admin', 'student'],
    required: true,
    default: 'student',
    description: "User's role in the system"
  },
  schoolId: {
    type: String,
    ref: 'School',
    default: null,
    description: "Reference to assigned school (populated during school_admin role or student enrollment)"
  },
  isActive: {
    type: Boolean,
    default: true,
    description: "Whether user account is active"
  },
  lastLogin: {
    type: Date,
    default: null,
    description: "Timestamp of most recent successful login"
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    description: "Account creation timestamp"
  },
  updatedAt: {
    type: Date,
    default: () => new Date(),
    description: "Last profile update timestamp"
  }
}
```

**Indexes**:
```javascript
{
  username: 1,          // For login lookups (unique constraint)
  email: 1,             // For email-based queries (unique constraint)
  role: 1,              // For role-based filtering
  schoolId: 1,          // For school admin and student queries
  isActive: 1           // For active user queries
}
```

**Note**: Student users are linked to Student profiles via `Student.userId = User._id`

---

### 2. Schools Collection

**Purpose**: Store school information and administrative details

```javascript
{
  _id: {
    type: String,
    default: () => nanoid(),
    description: "Unique school identifier"
  },
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100,
    description: "Official school name"
  },
  description: {
    type: String,
    maxlength: 500,
    description: "School description or mission statement"
  },
  address: {
    type: String,
    required: true,
    description: "Street address of school"
  },
  city: {
    type: String,
    required: true,
    description: "City where school is located"
  },
  state: {
    type: String,
    required: true,
    description: "State/Province where school is located"
  },
  zipCode: {
    type: String,
    required: true,
    match: /^\d{5,10}$/,
    description: "Postal/ZIP code"
  },
  phone: {
    type: String,
    required: true,
    match: /^\d{10,15}$/,
    description: "School's primary phone number"
  },
  email: {
    type: String,
    required: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: "School's email address"
  },
  adminId: {
    type: String,
    ref: 'User',
    required: true,
    description: "Reference to school administrator user"
  },
  totalStudents: {
    type: Number,
    default: 0,
    description: "Total number of enrolled students"
  },
  totalClassrooms: {
    type: Number,
    default: 0,
    description: "Total number of classrooms"
  },
  academicYear: {
    type: String,
    required: true,
    pattern: "YYYY-YYYY",
    description: "Current academic year (e.g., 2024-2025)"
  },
  isActive: {
    type: Boolean,
    default: true,
    description: "Whether school is active"
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    description: "School creation timestamp"
  },
  updatedAt: {
    type: Date,
    default: () => new Date(),
    description: "Last update timestamp"
  }
}
```

**Indexes**:
```javascript
{
  name: 1,              // For school name searches
  adminId: 1,           // For admin lookups
  isActive: 1,          // For active school queries
  academicYear: 1       // For academic year filtering
}
```

---

### 3. Classrooms Collection

**Purpose**: Store classroom information, capacity, and resources

```javascript
{
  _id: {
    type: String,
    default: () => nanoid(),
    description: "Unique classroom identifier"
  },
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
    description: "Classroom name (e.g., Class 10-A)"
  },
  grade: {
    type: String,
    required: true,
    enum: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    description: "Grade/standard level"
  },
  section: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E', 'F'],
    description: "Section/division letter"
  },
  schoolId: {
    type: String,
    ref: 'School',
    required: true,
    description: "Reference to parent school"
  },
  teacherId: {
    type: String,
    default: null,
    description: "ID of assigned class teacher"
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    description: "Maximum student capacity"
  },
  currentEnrollment: {
    type: Number,
    default: 0,
    description: "Current number of enrolled students"
  },
  room: {
    type: String,
    required: true,
    maxlength: 20,
    description: "Room number/identifier"
  },
  academicYear: {
    type: String,
    required: true,
    description: "Academic year for this classroom"
  },
  resources: [{
    name: {
      type: String,
      description: "Resource name (e.g., Projector, Whiteboard)"
    },
    quantity: {
      type: Number,
      description: "Quantity available"
    },
    condition: {
      type: String,
      enum: ['good', 'fair', 'poor'],
      default: 'good',
      description: "Condition status of resource"
    }
  }],
  schedule: {
    startTime: {
      type: String,
      description: "Class start time (HH:MM format)"
    },
    endTime: {
      type: String,
      description: "Class end time (HH:MM format)"
    },
    days: {
      type: [String],
      description: "Days when class operates (Mon, Tue, etc.)"
    }
  },
  maxCapacityReached: {
    type: Boolean,
    default: false,
    description: "Whether classroom is at full capacity"
  },
  isActive: {
    type: Boolean,
    default: true,
    description: "Whether classroom is active"
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    description: "Creation timestamp"
  },
  updatedAt: {
    type: Date,
    default: () => new Date(),
    description: "Last update timestamp"
  }
}
```

**Indexes**:
```javascript
{
  schoolId: 1,          // For school filtering
  grade: 1,             // For grade-level searches
  section: 1,           // For section filtering
  "grade_1_section_1": { // Compound index for grade+section
    grade: 1,
    section: 1
  },
  academicYear: 1,      // For academic year filtering
  isActive: 1           // For active classroom queries
}
```

---

### 4. Students Collection

**Purpose**: Store student enrollment records, academic progress, and profile information. Linked to User accounts via userId.

```javascript
{
  _id: {
    type: String,
    ref: 'User',
    required: true,
    description: "Uses userId from User document (establishes link to auth account)"
  },
  userId: {
    type: String,
    ref: 'User',
    required: true,
    unique: true,
    description: "Reference to user account (one-to-one relationship)"
  },
  firstName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
    description: "Student's first name"
  },
  lastName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
    description: "Student's last name"
  },
  schoolId: {
    type: String,
    ref: 'School',
    required: true,
    description: "Reference to enrolled school"
  },
  classroomId: {
    type: String,
    ref: 'Classroom',
    required: true,
    description: "Reference to assigned classroom"
  },
  rollNumber: {
    type: String,
    required: true,
    description: "Roll number within classroom (auto-generated, e.g., '1', '2', '3')"
  },
  dateOfBirth: {
    type: Date,
    required: true,
    description: "Student's date of birth"
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
    description: "Student's gender"
  },
  parentName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100,
    description: "Parent or guardian full name"
  },
  parentPhone: {
    type: String,
    required: true,
    match: /^\d{10,15}$/,
    description: "Parent's contact phone number"
  },
  parentEmail: {
    type: String,
    required: true,
    match: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    description: "Parent's email address"
  },
  address: {
    type: String,
    required: true,
    description: "Student's residential address"
  },
  admissionNumber: {
    type: String,
    required: true,
    unique: true,
    description: "Unique admission number (format: SCHO-YEAR-NANOID)"
  },
  admissionDate: {
    type: Date,
    default: () => new Date(),
    description: "Date of enrollment in school"
  },
  academicYear: {
    type: String,
    required: true,
    match: /^\d{4}-\d{4}$/,
    description: "Academic year of enrollment"
  },
  attendance: {
    present: {
      type: Number,
      default: 0,
      description: "Total days marked present"
    },
    absent: {
      type: Number,
      default: 0,
      description: "Total days marked absent"
    },
    leave: {
      type: Number,
      default: 0,
      description: "Total days on leave"
    },
    description: "Attendance tracking by status"
  },
  marks: [{
    subject: {
      type: String,
      description: "Subject name"
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      description: "Score obtained (0-100)"
    },
    date: {
      type: Date,
      default: () => new Date(),
      description: "Date mark was recorded"
    }
  }],
  enrollmentStatus: {
    type: String,
    enum: ['active', 'transferred', 'graduated', 'dropped'],
    default: 'active',
    description: "Current enrollment status"
  },
  transferHistory: [{
    fromClassroom: {
      type: String,
      ref: 'Classroom',
      description: "Classroom transferred from"
    },
    toClassroom: {
      type: String,
      ref: 'Classroom',
      description: "Classroom transferred to"
    },
    transferDate: {
      type: Date,
      description: "Date of transfer"
    },
    reason: {
      type: String,
      description: "Reason for transfer"
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
    description: "Whether student record is active"
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
    description: "Student enrollment creation timestamp"
  },
  updatedAt: {
    type: Date,
    default: () => new Date(),
    description: "Last update timestamp"
  }
}
```

**Indexes**:
```javascript
{
  schoolId: 1,                      // For school filtering
  classroomId: 1,                   // For classroom filtering
  userId: 1,                        // For user lookups (unique constraint)
  admissionNumber: 1,               // For admission number searches (unique constraint)
  "schoolId": 1, "classroomId": 1,  // Compound for efficient school+classroom queries
  "rollNumber": 1, "classroomId": 1 // Compound for roll number searches
}
```

---

## Data Type Definitions

| Type | Description | MongoDB Equivalent |
|------|-------------|-------------------|
| String | Text data | String |
| Number | Integer or float values | Number |
| Date | Timestamp objects | Date |
| Boolean | True/False values | Boolean |
| Array | Ordered collections | Array |
| Object | Nested documents | Object |
| Enum | Predefined string values | String with enum |

---

## Relationships and Cardinality

### User-School Relationship
- **Type**: One-to-Many (1:M)
- **Direction**: School Admin (User) manages School
- **Referential Integrity**: School.adminId → User._id
- **Cardinality**: One school_admin can manage one school; one superadmin manages many schools
- **Cascade Behavior**: When admin is deleted, school remains (admin reassignment needed)

### User-Student Relationship (NEW)
- **Type**: One-to-One (1:1)
- **Direction**: User account links to Student profile
- **Referential Integrity**: Student.userId → User._id (also Student._id = User._id)
- **Cardinality**: One student user → exactly one student profile
- **Cascade Behavior**: When student user deleted, student profile should be deactivated
- **Note**: This is the primary link created in the two-step enrollment process

### School-Classroom Relationship
- **Type**: One-to-Many (1:M)
- **Direction**: School has many Classrooms
- **Referential Integrity**: Classroom.schoolId → School._id
- **Cardinality**: One school can have many classrooms
- **Cascade Behavior**: When school is deleted, mark classrooms inactive

### Classroom-Student Relationship
- **Type**: One-to-Many (1:M)
- **Direction**: Classroom has many Students
- **Referential Integrity**: Student.classroomId → Classroom._id
- **Cardinality**: One classroom enrolls many students
- **Cascade Behavior**: When classroom is deleted, transfer or deactivate students

### School-Student Relationship
- **Type**: One-to-Many (1:M)
- **Direction**: School has many Students
- **Referential Integrity**: Student.schoolId → School._id
- **Cardinality**: One school has many students
- **Cascade Behavior**: Linked automatically through enrollment

---

## Indexing Strategy

### Rationale for Indexes

1. **Input Validation Indexes**
   - username, email (Users): Prevent duplicates and speed up login
   - admissionNumber (Students): Ensure unique admission numbers

2. **Query Optimization Indexes**
   - schoolId, classroomId: Common filter operations
   - role, isActive: Frequent filtering conditions
   - academicYear: Year-based data retrieval

3. **Compound Indexes**
   - schoolId + classroomId: Used together in student queries
   - grade + section: Used together for classroom searches

---

## Validation Rules by Collection

### Users
- password: minimum 8 characters, must be hashed before storage
- email: must be valid format
- username: 3-20 characters, unique
- role: must be one of defined enum values

### Schools
- name: 3-100 characters
- zipCode: 5-10 digits
- phone: 10-15 digits
- academicYear: format YYYY-YYYY

### Classrooms
- capacity: 1-100 students
- grade: must be K or 1-12
- section: must be A-F
- proportion: currentEnrollment ≤ capacity

### Students
- admissionNumber: unique across all students
- dateOfBirth: valid date
- score (marks): 0-100 only
- parentPhone: 10-15 digits
- enrollmentStatus: must match enum

---

## Performance Considerations

### Query Optimization
- Use indexed fields for WHERE conditions
- Limit and skip for pagination
- Project only needed fields
- Use compound indexes for multi-field queries

### Caching Strategy
- Cache school objects (1 hour TTL)
- Cache classroom objects (1 hour TTL)
- Cache user sessions (24 hour TTL)
- Cache frequently accessed students (30 min TTL)

### Growth Projections
- Schools: 0-1000 documents (small collection)
- Classrooms: 0-50,000 documents (grows with schools)
- Students: 0-500,000 documents (largest collection)
- Users: 0-100,000 documents (grows slowly)

---

## Backup and Disaster Recovery

- **Backup Frequency**: Daily MongoDB dumps
- **Retention**: 30 days of backups
- **Recovery Strategy**:
  1. Restore from latest backup
  2. Verify data integrity with queries
  3. Test user access across roles
  4. Validate referential integrity

---

## Database Connection

```javascript
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/school_management';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('./models/User.model');
const School = require('./models/School.model');
const Classroom = require('./models/Classroom.model');
const Student = require('./models/Student.model');
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | Feb 19, 2026 | Updated enrollment flow: two-step process (registerStudentUser → enrollStudent), added userId field to Student, User.studentId removed, cleaner 1:1 relationship |
| 1.0.0 | Feb 18, 2026 | Initial schema design with single-step enrollment |

---

## Key Changes from Version 1.0 to 2.0

### Breaking Changes ⚠️
1. **Student enrollment is now two-step**:
   - Step 1: `registerStudentUser` (Auth) - Create user account only
   - Step 2: `enrollStudent` (Student) - Enroll in classroom with full profile data

2. **Student model now includes userId**:
   - Direct reference to User authentication record
   - Student._id now equals User._id for consistency
   - Removes ambiguity about student identity

3. **Removed studentId from User model**:
   - User table no longer has studentId field
   - Use Student.userId instead (reversed relationship)
   - One-to-one relationship enforced via unique constraint

### Benefits of Changes ✓
- **Cleaner separation of concerns**: Authentication (User) vs. Enrollment (Student)
- **Better data integrity**: Student profile always linked to user with matching IDs
- **Flexible workflow**: Can create users before assigning to classrooms
- **Consistent IDs**: Student._id = User._id makes lookups straightforward
- **Referential clarity**: Student references User (not vice versa)

### Migration Path
If upgrading from 1.0:
1. Add `userId` field to all Student documents with value = Student._id
2. Add unique index on Student.userId
3. Remove or deprecate `studentId` field from User documents
4. Update API endpoints to use new two-step flow
5. Update documentation and client applications

---


