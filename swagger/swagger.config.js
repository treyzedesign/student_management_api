const swaggerJsdoc = require('swagger-jsdoc');

const serverUrl = `http://localhost:${process.env.USER_PORT || 3000}`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'School Management System API',
      version: '1.0.0',
      description: 'Complete API for managing schools, classrooms, students, and user authentication',
      contact: {
        name: 'API Support',
        url: serverUrl,
      },
    },
    servers: [
      {
        url: serverUrl,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer token for authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'password', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address',
            },
            role: {
              type: 'string',
              enum: ['superadmin', 'school_admin', 'student'],
              description: 'User role',
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'User active status',
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp',
            },
          },
        },
        School: {
          type: 'object',
          required: ['name', 'email', 'phone', 'address', 'city'],
          properties: {
            _id: {
              type: 'string',
              description: 'School ID',
            },
            name: {
              type: 'string',
              description: 'School name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'School email',
            },
            phone: {
              type: 'string',
              description: 'School phone number',
            },
            address: {
              type: 'string',
              description: 'School address',
            },
            city: {
              type: 'string',
              description: 'City',
            },
            state: {
              type: 'string',
              description: 'State',
            },
            zipCode: {
              type: 'string',
              description: 'Zip code',
            },
            adminId: {
              type: 'string',
              description: 'School admin user ID',
            },
            totalStudents: {
              type: 'number',
              description: 'Total number of students',
            },
            totalClassrooms: {
              type: 'number',
              description: 'Total number of classrooms',
            },
            academicYear: {
              type: 'string',
              description: 'Current academic year',
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'School active status',
            },
          },
        },
        Classroom: {
          type: 'object',
          required: ['name', 'grade', 'section', 'schoolId', 'capacity'],
          properties: {
            _id: {
              type: 'string',
              description: 'Classroom ID',
            },
            name: {
              type: 'string',
              description: 'Classroom name',
            },
            grade: {
              type: 'string',
              description: 'Grade level',
            },
            section: {
              type: 'string',
              description: 'Section/batch',
            },
            schoolId: {
              type: 'string',
              description: 'School ID reference',
            },
            capacity: {
              type: 'number',
              description: 'Classroom capacity',
            },
            currentEnrollment: {
              type: 'number',
              description: 'Current number of enrolled students',
            },
            room: {
              type: 'string',
              description: 'Room number/location',
            },
            academicYear: {
              type: 'string',
              description: 'Academic year',
            },
          },
        },
        Student: {
          type: 'object',
          required: ['firstName', 'lastName', 'schoolId', 'classroomId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Student ID',
            },
            firstName: {
              type: 'string',
              description: 'First name',
            },
            lastName: {
              type: 'string',
              description: 'Last name',
            },
            schoolId: {
              type: 'string',
              description: 'School ID reference',
            },
            classroomId: {
              type: 'string',
              description: 'Classroom ID reference',
            },
            rollNumber: {
              type: 'number',
              description: 'Roll number in classroom',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Date of birth',
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              description: 'Gender',
            },
            admissionNumber: {
              type: 'string',
              description: 'Unique admission number',
            },
            enrollmentStatus: {
              type: 'string',
              enum: ['active', 'transferred', 'graduated', 'dropped'],
              default: 'active',
              description: 'Enrollment status',
            },
            parentName: {
              type: 'string',
              description: 'Parent/Guardian name',
            },
            parentPhone: {
              type: 'string',
              description: 'Parent phone number',
            },
            parentEmail: {
              type: 'string',
              format: 'email',
              description: 'Parent email',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Error code',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './managers/auth/Auth.manager.js',
    './managers/school/School.manager.js',
    './managers/classroom/Classroom.manager.js',
    './managers/student/Student.manager.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
