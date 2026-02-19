/**
 * Classroom Manager Test Suite
 * Tests for classroom management endpoints
 */
const ClassroomManager = require('../managers/classroom/Classroom.manager');

describe('ClassroomManager', () => {
    let classroomManager;
    let mockUtils, mockCache, mockConfig, mockCortex, mockManagers, mockValidators;
    let mockClassroomModel, mockSchoolModel, mockStudentModel;

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
            classroomValidators: {
                createClassroomValidationRules: jest.fn().mockReturnValue([])
            }
        };

        // Mock Models as constructors
        mockClassroomModel = jest.fn();
        mockClassroomModel.findById = jest.fn();
        mockClassroomModel.find = jest.fn();
        mockClassroomModel.countDocuments = jest.fn();

        mockSchoolModel = jest.fn();
        mockSchoolModel.findById = jest.fn();

        mockStudentModel = jest.fn();
        mockStudentModel.find = jest.fn();
        mockStudentModel.countDocuments = jest.fn();

        // Create ClassroomManager instance
        classroomManager = new ClassroomManager({
            utils: mockUtils,
            cache: mockCache,
            config: mockConfig,
            cortex: mockCortex,
            managers: mockManagers,
            validators: mockValidators
        });

        // Override model imports
        classroomManager.ClassroomModel = mockClassroomModel;
        classroomManager.SchoolModel = mockSchoolModel;
        classroomManager.StudentModel = mockStudentModel;
    });

    describe('createClassroom', () => {
        it('should create classroom successfully with school admin authorization', async () => {
            const mockSchool = {
                _id: 'school-123',
                name: 'Test School'
            };

            const mockClassroomInstance = {
                _id: 'classroom-id',
                schoolId: 'school-123',
                name: 'Grade 5-A',
                grade: '5',
                section: 'A',
                capacity: 40,
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'classroom-id',
                    name: 'Grade 5-A',
                    grade: '5',
                    section: 'A',
                    capacity: 40
                })
            };

            mockSchoolModel.findById.mockResolvedValue(mockSchool);
            mockClassroomModel.mockImplementation(() => mockClassroomInstance);

            const result = await classroomManager.createClassroom({
                schoolId: 'school-123',
                name: 'Grade 5-A',
                grade: '5',
                section: 'A',
                capacity: 40,
                room: '101',
                academicYear: '2025-2026',
                teacherId: 'teacher-1',
                schedule: { days: ['Monday', 'Wednesday', 'Friday'] },
                __longToken: { role: 'school_admin', userId: 'admin-id', schoolId: 'school-123' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(201);
        });

        it('should deny access if user is not school admin', async () => {
            const result = await classroomManager.createClassroom({
                schoolId: 'school-123',
                name: 'Grade 5-A',
                grade: '5',
                section: 'A',
                capacity: 40,
                room: '101',
                academicYear: '2025-2026',
                __longToken: { role: 'student', userId: 'student-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(403);
        });

        it('should fail if school does not exist', async () => {
            mockSchoolModel.findById.mockResolvedValue(null);

            const result = await classroomManager.createClassroom({
                schoolId: 'nonexistent-school',
                name: 'Grade 5-A',
                grade: '5',
                section: 'A',
                capacity: 40,
                room: '101',
                academicYear: '2025-2026',
                __longToken: { role: 'school_admin', userId: 'admin-id', schoolId: 'nonexistent-school' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });

        it('should fail if capacity is less than 1', async () => {
            const result = await classroomManager.createClassroom({
                schoolId: 'school-123',
                name: 'Grade 5-A',
                grade: '5',
                section: 'A',
                capacity: 0,
                room: '101',
                academicYear: '2025-2026',
                __longToken: { role: 'school_admin', userId: 'admin-id', schoolId: 'school-123' }
            });

            expect(result.ok).toBe(false);
        });
    });

    describe('getClassroomById', () => {
        it('should retrieve classroom by ID successfully', async () => {
            const mockClassroom = {
                _id: 'classroom-123',
                name: 'Grade 5-A',
                grade: '5',
                section: 'A',
                capacity: 40,
                toObject: jest.fn().mockReturnValue({
                    _id: 'classroom-123',
                    name: 'Grade 5-A',
                    grade: '5',
                    section: 'A',
                    capacity: 40
                })
            };

            mockClassroomModel.findById.mockResolvedValue(mockClassroom);

            const result = await classroomManager.getClassroomById({
                classroomId: 'classroom-123',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
            expect(result.data.name).toBe('Grade 5-A');
        });

        it('should fail if classroom is not found', async () => {
            mockClassroomModel.findById.mockResolvedValue(null);

            const result = await classroomManager.getClassroomById({
                classroomId: 'nonexistent-id',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('getSchoolClassrooms', () => {
        it('should retrieve school classrooms with pagination', async () => {
            const mockSchool = {
                _id: 'school-123',
                name: 'Test School'
            };

            const mockClassrooms = [
                { _id: 'classroom-1', name: 'Grade 5-A', grade: '5', section: 'A' },
                { _id: 'classroom-2', name: 'Grade 5-B', grade: '5', section: 'B' }
            ];

            mockSchoolModel.findById.mockResolvedValue(mockSchool);
            mockClassroomModel.find.mockReturnValue({
                skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue(mockClassrooms)
                })
            });
            mockClassroomModel.countDocuments.mockResolvedValue(2);

            const result = await classroomManager.getSchoolClassrooms({
                schoolId: 'school-123',
                page: 1,
                limit: 10,
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
            expect(result.data.classrooms.length).toBe(2);
        });

        it('should filter classrooms by grade', async () => {
            const mockSchool = {
                _id: 'school-123',
                name: 'Test School'
            };

            const mockClassrooms = [
                { _id: 'classroom-1', name: 'Grade 5-A', grade: '5', section: 'A' }
            ];

            mockSchoolModel.findById.mockResolvedValue(mockSchool);
            mockClassroomModel.find.mockReturnValue({
                skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue(mockClassrooms)
                })
            });
            mockClassroomModel.countDocuments.mockResolvedValue(1);

            const result = await classroomManager.getSchoolClassrooms({
                schoolId: 'school-123',
                grade: '5',
                page: 1,
                limit: 10,
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.data.classrooms.length).toBe(1);
        });
    });

    describe('updateClassroom', () => {
        it('should update classroom successfully', async () => {
            const mockClassroom = {
                _id: 'classroom-123',
                name: 'Grade 5-A',
                grade: '5',
                section: 'A',
                capacity: 40,
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'classroom-123',
                    name: 'Grade 5-A Updated',
                    grade: '5',
                    section: 'A',
                    capacity: 45
                })
            };

            mockClassroomModel.findById.mockResolvedValue(mockClassroom);

            const result = await classroomManager.updateClassroom({
                classroomId: 'classroom-123',
                name: 'Grade 5-A Updated',
                capacity: 45,
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
        });

        it('should fail if classroom is not found', async () => {
            mockClassroomModel.findById.mockResolvedValue(null);

            const result = await classroomManager.updateClassroom({
                classroomId: 'nonexistent-id',
                name: 'Updated Name',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('deleteClassroom', () => {
        it('should delete classroom successfully if no students enrolled', async () => {
            const mockClassroom = {
                _id: 'classroom-123',
                name: 'Grade 5-A',
                isActive: true,
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'classroom-123',
                    name: 'Grade 5-A'
                })
            };

            mockClassroomModel.findById.mockResolvedValue(mockClassroom);
            mockStudentModel.countDocuments.mockResolvedValue(0);

            const result = await classroomManager.deleteClassroom({
                classroomId: 'classroom-123',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
        });

        it('should fail if classroom still has enrolled students', async () => {
            const mockClassroom = {
                _id: 'classroom-123',
                name: 'Grade 5-A'
            };

            mockClassroomModel.findById.mockResolvedValue(mockClassroom);
            mockStudentModel.countDocuments.mockResolvedValue(10);

            const result = await classroomManager.deleteClassroom({
                classroomId: 'classroom-123',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(400);
        });

        it('should fail if classroom is not found', async () => {
            mockClassroomModel.findById.mockResolvedValue(null);

            const result = await classroomManager.deleteClassroom({
                classroomId: 'nonexistent-id',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('getClassroomStudents', () => {
        it('should retrieve classroom students successfully', async () => {
            const mockClassroom = {
                _id: 'classroom-123',
                name: 'Grade 5-A',
                capacity: 40
            };

            const mockStudents = [
                { _id: 'student-1', firstName: 'John', lastName: 'Doe' },
                { _id: 'student-2', firstName: 'Jane', lastName: 'Smith' }
            ];

            mockClassroomModel.findById.mockResolvedValue(mockClassroom);
            mockStudentModel.find.mockResolvedValue(mockStudents);
            mockStudentModel.countDocuments.mockResolvedValue(2);

            const result = await classroomManager.getClassroomStudents({
                classroomId: 'classroom-123',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
            expect(result.data.totalEnrolled).toBe(2);
            expect(result.data.availableSeats).toBe(38);
        });

        it('should fail if classroom is not found', async () => {
            mockClassroomModel.findById.mockResolvedValue(null);

            const result = await classroomManager.getClassroomStudents({
                classroomId: 'nonexistent-id',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('httpExposed methods', () => {
        it('should have all required HTTP exposed methods', () => {
            const requiredMethods = [
                'post=createClassroom',
                'get=getClassroomById',
                'get=getSchoolClassrooms',
                'put=updateClassroom',
                'delete=deleteClassroom',
                'get=getClassroomStudents'
            ];

            requiredMethods.forEach(method => {
                expect(classroomManager.httpExposed).toContain(method);
            });
        });
    });
});
