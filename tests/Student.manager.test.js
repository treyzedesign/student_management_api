/**
 * Student Manager Test Suite
 * Tests for student enrollment and management endpoints
 */
const StudentManager = require('../managers/student/Student.manager');

describe('StudentManager', () => {
    let studentManager;
    let mockUtils, mockCache, mockConfig, mockCortex, mockManagers, mockValidators;
    let mockStudentModel, mockUserModel, mockSchoolModel, mockClassroomModel;

    beforeEach(() => {
        // Mock dependencies
        mockUtils = {};
        mockCache = {
            key: {
                set: jest.fn().mockResolvedValue(true),
                get: jest.fn().mockResolvedValue(null)
            }
        };
        mockConfig = {
            dotEnv: {
                JWT_SECRET: 'test-secret',
                USER_PORT: 3000
            }
        };
        mockCortex = {};
        mockManagers = {};
        mockValidators = {
            studentValidators: {
                enrollStudentValidationRules: jest.fn().mockReturnValue([])
            }
        };

        // Mock Models as constructors
        mockStudentModel = jest.fn();
        mockStudentModel.findById = jest.fn();
        mockStudentModel.find = jest.fn();
        mockStudentModel.countDocuments = jest.fn();

        mockUserModel = jest.fn();
        mockUserModel.findById = jest.fn();
        mockUserModel.updateOne = jest.fn();

        mockSchoolModel = jest.fn();
        mockSchoolModel.findById = jest.fn();
        mockSchoolModel.updateOne = jest.fn();

        mockClassroomModel = jest.fn();
        mockClassroomModel.findById = jest.fn();
        mockClassroomModel.updateOne = jest.fn();

        // Create StudentManager instance
        studentManager = new StudentManager({
            utils: mockUtils,
            cache: mockCache,
            config: mockConfig,
            cortex: mockCortex,
            managers: mockManagers,
            validators: mockValidators
        });

        // Override model imports
        studentManager.StudentModel = mockStudentModel;
        studentManager.UserModel = mockUserModel;
        studentManager.SchoolModel = mockSchoolModel;
        studentManager.ClassroomModel = mockClassroomModel;
    });

    describe('enrollStudent', () => {
        it('should enroll student successfully with school admin authorization', async () => {
            const mockUser = {
                _id: 'user-123',
                username: 'student1',
                role: 'student',
                save: jest.fn().mockResolvedValue(true)
            };

            const mockSchool = {
                _id: 'school-123',
                name: 'Test School'
            };

            const mockClassroom = {
                _id: 'classroom-123',
                name: 'Grade 5-A',
                capacity: 40,
                totalEnrolled: 10,
                updateOne: jest.fn().mockResolvedValue({ ok: 1 })
            };

            const mockStudentInstance = {
                _id: 'user-123',
                userId: 'user-123',
                firstName: 'John',
                lastName: 'Doe',
                schoolId: 'school-123',
                classroomId: 'classroom-123',
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'user-123',
                    userId: 'user-123',
                    firstName: 'John',
                    lastName: 'Doe',
                    rollNumber: 'RN-001',
                    admissionId: 'ADM-001'
                })
            };

            mockUserModel.findById.mockResolvedValue(mockUser);
            mockSchoolModel.findById.mockResolvedValue(mockSchool);
            mockClassroomModel.findById.mockResolvedValue(mockClassroom);
            mockStudentModel.mockImplementation(() => mockStudentInstance);

            const result = await studentManager.enrollStudent({
                userId: 'user-123',
                schoolId: 'school-123',
                classroomId: 'classroom-123',
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '2010-01-15',
                gender: 'male',
                parentName: 'Parent Name',
                parentPhone: '555-0123',
                parentEmail: 'parent@example.com',
                address: '123 Main St',
                academicYear: '2025-2026',
                __longToken: { role: 'school_admin', userId: 'admin-id', schoolId: 'school-123' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(201);
            expect(result.data.student.firstName).toBe('John');
        });

        it('should deny access if user is not school admin', async () => {
            const result = await studentManager.enrollStudent({
                userId: 'user-123',
                schoolId: 'school-123',
                classroomId: 'classroom-123',
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '2010-01-15',
                gender: 'male',
                parentName: 'Parent Name',
                parentPhone: '555-0123',
                parentEmail: 'parent@example.com',
                academicYear: '2025-2026',
                __longToken: { role: 'student', userId: 'student-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(403);
        });

        it('should fail if user is not found', async () => {
            mockUserModel.findById.mockResolvedValue(null);

            const result = await studentManager.enrollStudent({
                userId: 'nonexistent-user',
                schoolId: 'school-123',
                classroomId: 'classroom-123',
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '2010-01-15',
                gender: 'male',
                parentName: 'Parent Name',
                parentPhone: '555-0123',
                parentEmail: 'parent@example.com',
                academicYear: '2025-2026',
                __longToken: { role: 'school_admin', userId: 'admin-id', schoolId: 'school-123' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });

        it('should fail if school is not found', async () => {
            const mockUser = {
                _id: 'user-123',
                username: 'student1'
            };

            mockUserModel.findById.mockResolvedValue(mockUser);
            mockSchoolModel.findById.mockResolvedValue(null);

            const result = await studentManager.enrollStudent({
                userId: 'user-123',
                schoolId: 'nonexistent-school',
                classroomId: 'classroom-123',
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '2010-01-15',
                gender: 'male',
                parentName: 'Parent Name',
                parentPhone: '555-0123',
                parentEmail: 'parent@example.com',
                academicYear: '2025-2026',
                __longToken: { role: 'school_admin', userId: 'admin-id', schoolId: 'nonexistent-school' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });

        it('should fail if classroom is not found', async () => {
            const mockUser = {
                _id: 'user-123',
                username: 'student1'
            };

            const mockSchool = {
                _id: 'school-123',
                name: 'Test School'
            };

            mockUserModel.findById.mockResolvedValue(mockUser);
            mockSchoolModel.findById.mockResolvedValue(mockSchool);
            mockClassroomModel.findById.mockResolvedValue(null);

            const result = await studentManager.enrollStudent({
                userId: 'user-123',
                schoolId: 'school-123',
                classroomId: 'nonexistent-classroom',
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '2010-01-15',
                gender: 'male',
                parentName: 'Parent Name',
                parentPhone: '555-0123',
                parentEmail: 'parent@example.com',
                academicYear: '2025-2026',
                __longToken: { role: 'school_admin', userId: 'admin-id', schoolId: 'school-123' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });

        it('should fail if classroom is at full capacity', async () => {
            const mockUser = {
                _id: 'user-123',
                username: 'student1'
            };

            const mockSchool = {
                _id: 'school-123',
                name: 'Test School'
            };

            const mockClassroom = {
                _id: 'classroom-123',
                name: 'Grade 5-A',
                capacity: 40,
                totalEnrolled: 40
            };

            mockUserModel.findById.mockResolvedValue(mockUser);
            mockSchoolModel.findById.mockResolvedValue(mockSchool);
            mockClassroomModel.findById.mockResolvedValue(mockClassroom);

            const result = await studentManager.enrollStudent({
                userId: 'user-123',
                schoolId: 'school-123',
                classroomId: 'classroom-123',
                firstName: 'John',
                lastName: 'Doe',
                dateOfBirth: '2010-01-15',
                gender: 'male',
                parentName: 'Parent Name',
                parentPhone: '555-0123',
                parentEmail: 'parent@example.com',
                academicYear: '2025-2026',
                __longToken: { role: 'school_admin', userId: 'admin-id', schoolId: 'school-123' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(400);
        });
    });

    describe('getStudentById', () => {
        it('should retrieve student by ID successfully', async () => {
            const mockStudent = {
                _id: 'user-123',
                firstName: 'John',
                lastName: 'Doe',
                schoolId: 'school-123',
                classroomId: 'classroom-123',
                toObject: jest.fn().mockReturnValue({
                    _id: 'user-123',
                    firstName: 'John',
                    lastName: 'Doe',
                    schoolId: 'school-123',
                    classroomId: 'classroom-123'
                })
            };

            mockStudentModel.findById.mockResolvedValue(mockStudent);

            const result = await studentManager.getStudentById({
                studentId: 'user-123',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
            expect(result.data.firstName).toBe('John');
        });

        it('should fail if student is not found', async () => {
            mockStudentModel.findById.mockResolvedValue(null);

            const result = await studentManager.getStudentById({
                studentId: 'nonexistent-id',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('getStudentsBySchool', () => {
        it('should retrieve school students with pagination', async () => {
            const mockSchool = {
                _id: 'school-123',
                name: 'Test School'
            };

            const mockStudents = [
                { _id: 'student-1', firstName: 'John', lastName: 'Doe' },
                { _id: 'student-2', firstName: 'Jane', lastName: 'Smith' }
            ];

            mockSchoolModel.findById.mockResolvedValue(mockSchool);
            mockStudentModel.find.mockResolvedValue(mockStudents);
            mockStudentModel.countDocuments.mockResolvedValue(2);

            const result = await studentManager.getStudentsBySchool({
                schoolId: 'school-123',
                page: 1,
                limit: 20,
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
            expect(result.data.students.length).toBe(2);
        });

        it('should fail if school is not found', async () => {
            mockSchoolModel.findById.mockResolvedValue(null);

            const result = await studentManager.getStudentsBySchool({
                schoolId: 'nonexistent-school',
                page: 1,
                limit: 20,
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('getStudentsByClassroom', () => {
        it('should retrieve classroom students successfully', async () => {
            const mockClassroom = {
                _id: 'classroom-123',
                name: 'Grade 5-A'
            };

            const mockStudents = [
                { _id: 'student-1', firstName: 'John', lastName: 'Doe' },
                { _id: 'student-2', firstName: 'Jane', lastName: 'Smith' }
            ];

            mockClassroomModel.findById.mockResolvedValue(mockClassroom);
            mockStudentModel.find.mockResolvedValue(mockStudents);

            const result = await studentManager.getStudentsByClassroom({
                classroomId: 'classroom-123',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
            expect(result.data.classroomName).toBe('Grade 5-A');
            expect(result.data.students.length).toBe(2);
        });

        it('should fail if classroom is not found', async () => {
            mockClassroomModel.findById.mockResolvedValue(null);

            const result = await studentManager.getStudentsByClassroom({
                classroomId: 'nonexistent-id',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('updateStudent', () => {
        it('should update student information successfully', async () => {
            const mockStudent = {
                _id: 'user-123',
                firstName: 'John',
                lastName: 'Doe',
                parentName: 'Parent Name',
                parentPhone: '555-0123',
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'user-123',
                    firstName: 'John Updated',
                    lastName: 'Doe',
                    parentName: 'New Parent Name',
                    parentPhone: '555-0999'
                })
            };

            mockStudentModel.findById.mockResolvedValue(mockStudent);

            const result = await studentManager.updateStudent({
                studentId: 'user-123',
                firstName: 'John Updated',
                parentName: 'New Parent Name',
                parentPhone: '555-0999',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
        });

        it('should fail if student is not found', async () => {
            mockStudentModel.findById.mockResolvedValue(null);

            const result = await studentManager.updateStudent({
                studentId: 'nonexistent-id',
                firstName: 'John Updated',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('httpExposed methods', () => {
        it('should have all required HTTP exposed methods', () => {
            const requiredMethods = [
                'post=enrollStudent',
                'get=getStudentById',
                'get=getStudentsBySchool',
                'get=getStudentsByClassroom',
                'put=updateStudent'
            ];

            requiredMethods.forEach(method => {
                expect(studentManager.httpExposed).toContain(method);
            });
        });
    });
});
