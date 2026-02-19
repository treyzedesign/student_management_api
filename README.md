# 📝 School Management System API - Assessment Submission

## 🎓 Project Overview
This is a fully functional RESTful API for a School Management System built with Node.js, Express, MongoDB, and JWT authentication. The system implements Role-Based Access Control (RBAC) with three user roles: Superadmin, School Administrator, and Student.

---

## ✅ Core Implementation

### Architecture & Design
- ✅ RESTful API with proper HTTP methods (GET, POST, PUT, DELETE)
- ✅ Two-step student enrollment process: User registration → School enrollment
- ✅ Role-based access control (RBAC) with 3 distinct roles
- ✅ JWT-based authentication with long and short token support
- ✅ Comprehensive error handling with appropriate HTTP status codes
- ✅ Security enhancements: Helmet for headers, bcrypt for passwords, rate limiting on sensitive endpoints

### Database Architecture
- MongoDB with 4 main collections: Users, Schools, Classrooms, Students
- Proper indexing for performance optimization
- Schema validation at both model and application levels
- Relationship management between entities (Schools → Classrooms → Students)

### Key Features Implemented
1. **Authentication & Authorization**
   - JWT token generation and validation
   - Role-based middleware for access control
   - Password hashing with bcrypt
   - Token persistence in Swagger UI

2. **API Endpoints (32 total)**
   - Auth: 8 endpoints (register, login, profile, password change, logout)
   - Schools: 8 endpoints (CRUD + admin/student/classroom retrieval)
   - Classrooms: 8 endpoints (CRUD + capacity management + student assignment)
   - Students: 8 endpoints (enrollment, transfer, marks, attendance management)

3. **Security Measures**
   - Helmet middleware for HTTP header security
   - Express rate limiting:
     - 5 attempts/15min for auth
     - 3 attempts/hour for password change
     - 100 requests/15min for general API
   - CORS configuration
   - Input validation using express-validator
   - Password confirmation validation

4. **API Documentation**
   - Swagger/OpenAPI integration with interactive UI
   - Token persistence across page refreshes
   - Detailed endpoint documentation with request/response examples
   - Query parameter support for filtering and pagination

### Testing
- Comprehensive Jest test suite with 100+ test cases
- Tests cover: Authorization, validation, CRUD operations, error scenarios
- Mock implementations for all database models
- Test isolation and proper setup/teardown

---

## 📦 Deliverables

| Component | Status | Location |
|-----------|--------|----------|
| API Implementation | ✅ Complete | `/managers/` |
| Database Schema | ✅ Complete | `/models/` + `DATABASE_SCHEMA.md` |
| API Documentation | ✅ Complete | Swagger UI + `API_DOCUMENTATION.md` |
| Test Suite | ✅ Complete | `/tests/` (100+ cases) |
| Deployment Guide | ✅ Complete | `DEPLOYMENT_GUIDE.md` |
| Input Validation | ✅ Complete | `/validators/` |

---

## 🛠️ Technical Stack
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **Validation**: express-validator
- **Security**: Helmet, express-rate-limit
- **Documentation**: Swagger/OpenAPI with swagger-ui-express
- **Testing**: Jest + Supertest
- **Body Parser**: express.json() and express.urlencoded()

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Access Swagger UI
http://localhost:3000/api-docs
```

---

## 🔑 Key Implementation Details

1. **Two-Step Enrollment**: Students first register as users (Auth.registerStudentUser), then get enrolled in a school/classroom (Student.enrollStudent) using their userId.

2. **Query Parameters**: Resource IDs (schoolId, classroomId, studentId) are passed as query parameters in update/delete operations, not in request body.

3. **Token Persistence**: Swagger UI configured with localStorage to maintain authorization token across page refreshes.

4. **Rate Limiting Strategy**:
   - General API: 100 requests per 15 minutes
   - Authentication routes: 5 attempts per 15 minutes
   - Password change: 3 attempts per 1 hour

5. **Caching**: Implemented for frequently accessed data (schools list, student profiles).

---

## 🧪 Testing Strategy
- Unit tests for each manager class
- Integration tests for endpoint flows
- Authorization/RBAC testing
- Error scenario testing
- Data validation testing

---

## 📊 Project Structure

```
axion/
├── managers/              # Business logic managers
│   ├── auth/             # Authentication
│   ├── school/           # School management
│   ├── classroom/        # Classroom management
│   ├── student/          # Student management
│   └── http/             # Express server setup
├── models/               # MongoDB schemas
├── mws/                  # Middleware (RBAC, token, etc.)
├── validators/           # Input validation
├── tests/                # Test suites (100+ cases)
├── config/               # Environment configuration
├── cache/                # Caching strategy
├── loaders/              # Application initialization
├── swagger/              # API documentation
└── public/               # Static data (countries, emojis)
```

---

## ✨ Features Highlights

✅ **Complete CRUD Operations** for all entities
✅ **Role-Based Access Control** with 3 roles
✅ **JWT Authentication** with token expiration/refresh
✅ **Input Validation** on all endpoints
✅ **Error Handling** with proper HTTP status codes
✅ **Rate Limiting** on sensitive operations
✅ **Swagger Documentation** with live testing
✅ **Test Suite** with 100+ test cases
✅ **Security Headers** with Helmet
✅ **Database Indexing** for performance
✅ **Caching Strategy** for frequently accessed data
✅ **Comprehensive Error Messages** for debugging

---

## 🔒 Security Implementation
- JWT token generation and validation
- Bcrypt password hashing (10 salt rounds)
- Role-based access control via middleware
- Input validation and sanitization
- HTTP header security with Helmet
- Express rate limiting on auth endpoints
- CORS configuration
- Environment variable protection (no hardcoded secrets)

---

## 📈 Performance Optimizations
- Database indexing on frequently queried fields
- Redis caching for schools and classrooms
- Query optimization with field projection
- Connection pooling for database
- Request rate limiting to prevent abuse

---

## 🎯 Submission Status

**Status**: ✅ **PRODUCTION READY**

This School Management System API is fully functional and ready for deployment. All core requirements have been implemented:
- Complete REST API with proper HTTP semantics
- JWT-based authentication with RBAC
- MongoDB database integration
- Comprehensive input validation
- Security measures (Helmet, rate limiting)
- Swagger API documentation
- Test suite with 100+ test cases
- Error handling and logging

---

**Version**: 1.0.0
**Submission Date**: February 19, 2026
**Framework**: Node.js + Express.js + MongoDB
