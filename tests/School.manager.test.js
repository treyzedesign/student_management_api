/**
 * School Manager Test Suite
 * Tests for school management endpoints
 */
const SchoolManager = require('../managers/school/School.manager');

describe('SchoolManager', () => {
    let schoolManager;
    let mockUtils, mockCache, mockConfig, mockCortex, mockManagers, mockValidators;
    let mockSchoolModel, mockUserModel;

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
        mockValidators = {};

        // Mock Models as constructors
        mockSchoolModel = jest.fn();
        mockSchoolModel.findById = jest.fn();
        mockSchoolModel.find = jest.fn();
        mockSchoolModel.countDocuments = jest.fn();

        mockUserModel = jest.fn();
        mockUserModel.findById = jest.fn();
        mockUserModel.find = jest.fn();
        mockUserModel.countDocuments = jest.fn();

        // Create SchoolManager instance
        schoolManager = new SchoolManager({
            utils: mockUtils,
            cache: mockCache,
            config: mockConfig,
            cortex: mockCortex,
            managers: mockManagers,
            validators: mockValidators
        });

        // Override model imports
        schoolManager.SchoolModel = mockSchoolModel;
        schoolManager.UserModel = mockUserModel;
    });

    describe('createSchool', () => {
        it('should create school successfully with superadmin authorization', async () => {
            const mockAdmin = {
                _id: 'admin-id',
                role: 'student',
                save: jest.fn().mockResolvedValue(true)
            };

            const mockSchoolInstance = {
                _id: 'school-id',
                name: 'Test School',
                description: 'A test school',
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'school-id',
                    name: 'Test School',
                    description: 'A test school'
                })
            };

            mockUserModel.findById.mockResolvedValue(mockAdmin);
            mockSchoolModel.mockImplementation(() => mockSchoolInstance);

            const result = await schoolManager.createSchool({
                name: 'Test School',
                description: 'A test school',
                address: '123 Main St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
                phone: '555-0123',
                email: 'school@example.com',
                adminId: 'admin-id',
                totalStudents: 500,
                totalClassrooms: 20,
                academicYear: '2025-2026',
                __longToken: { role: 'superadmin', userId: 'superadmin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(201);
        });

        it('should deny access if user is not superadmin', async () => {
            const result = await schoolManager.createSchool({
                name: 'Test School',
                description: 'A test school',
                address: '123 Main St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
                phone: '555-0123',
                email: 'school@example.com',
                adminId: 'admin-id',
                totalStudents: 500,
                totalClassrooms: 20,
                academicYear: '2025-2026',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(403);
        });

        it('should fail if admin user does not exist', async () => {
            mockUserModel.findById.mockResolvedValue(null);

            const result = await schoolManager.createSchool({
                name: 'Test School',
                description: 'A test school',
                address: '123 Main St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
                phone: '555-0123',
                email: 'school@example.com',
                adminId: 'nonexistent-id',
                totalStudents: 500,
                totalClassrooms: 20,
                academicYear: '2025-2026',
                __longToken: { role: 'superadmin', userId: 'superadmin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });

        it('should fail if no role is found in token', async () => {
            const result = await schoolManager.createSchool({
                name: 'Test School',
                description: 'A test school',
                address: '123 Main St',
                city: 'Test City',
                state: 'TS',
                zipCode: '12345',
                phone: '555-0123',
                email: 'school@example.com',
                adminId: 'admin-id',
                totalStudents: 500,
                totalClassrooms: 20,
                academicYear: '2025-2026',
                __longToken: { userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(403);
        });
    });

    describe('getSchoolById', () => {
        it('should retrieve school by ID successfully', async () => {
            const mockSchool = {
                _id: 'school-123',
                name: 'Test School',
                description: 'A test school',
                toObject: jest.fn().mockReturnValue({
                    _id: 'school-123',
                    name: 'Test School',
                    description: 'A test school'
                })
            };

            mockSchoolModel.findById.mockResolvedValue(mockSchool);

            const result = await schoolManager.getSchoolById({
                schoolId: 'school-123'
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
            expect(result.data.name).toBe('Test School');
        });

        it('should return cached school if available', async () => {
            const cachedSchool = {
                _id: 'school-123',
                name: 'Cached School'
            };

            mockCache.key.get.mockResolvedValue(JSON.stringify(cachedSchool));

            const result = await schoolManager.getSchoolById({
                schoolId: 'school-123'
            });

            expect(result.ok).toBe(true);
            expect(mockCache.key.get).toHaveBeenCalled();
        });

        it('should fail if school is not found', async () => {
            mockSchoolModel.findById.mockResolvedValue(null);

            const result = await schoolManager.getSchoolById({
                schoolId: 'nonexistent-id'
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('getAllSchools', () => {
        it('should retrieve all schools with superadmin authorization', async () => {
            const mockSchools = [
                { _id: 'school-1', name: 'School 1' },
                { _id: 'school-2', name: 'School 2' }
            ];

            mockSchoolModel.find.mockReturnValue({
                skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue(mockSchools)
                })
            });

            mockSchoolModel.countDocuments.mockResolvedValue(2);

            const result = await schoolManager.getAllSchools({
                page: 1,
                limit: 10,
                __longToken: { role: 'superadmin', userId: 'superadmin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
        });

        it('should deny access if user is not superadmin', async () => {
            const result = await schoolManager.getAllSchools({
                page: 1,
                limit: 10,
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(403);
        });

        it('should return correct pagination data', async () => {
            const mockSchools = Array(10).fill().map((_, i) => ({
                _id: `school-${i}`,
                name: `School ${i}`
            }));

            mockSchoolModel.find.mockReturnValue({
                skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue(mockSchools)
                })
            });

            mockSchoolModel.countDocuments.mockResolvedValue(25);

            const result = await schoolManager.getAllSchools({
                page: 1,
                limit: 10,
                __longToken: { role: 'superadmin', userId: 'superadmin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.data.pagination.totalSchools).toBe(25);
        });
    });

    describe('updateSchool', () => {
        it('should update school successfully with proper authorization', async () => {
            const mockSchool = {
                _id: 'school-123',
                name: 'Old Name',
                description: 'Old description',
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'school-123',
                    name: 'Updated School',
                    description: 'Updated description'
                })
            };

            mockSchoolModel.findById.mockResolvedValue(mockSchool);

            const result = await schoolManager.updateSchool({
                schoolId: 'school-123',
                name: 'Updated School',
                description: 'Updated description',
                __longToken: { role: 'superadmin', userId: 'superadmin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
        });

        it('should fail if school is not found', async () => {
            mockSchoolModel.findById.mockResolvedValue(null);

            const result = await schoolManager.updateSchool({
                schoolId: 'nonexistent-id',
                name: 'Updated School',
                __longToken: { role: 'superadmin', userId: 'superadmin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('deleteSchool', () => {
        it('should delete school successfully with superadmin authorization', async () => {
            const mockSchool = {
                _id: 'school-123',
                name: 'Test School',
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'school-123',
                    name: 'Test School'
                })
            };

            mockSchoolModel.findById.mockResolvedValue(mockSchool);

            const result = await schoolManager.deleteSchool({
                schoolId: 'school-123',
                __longToken: { role: 'superadmin', userId: 'superadmin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
        });

        it('should deny access if user is not superadmin', async () => {
            const result = await schoolManager.deleteSchool({
                schoolId: 'school-123',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(403);
        });

        it('should fail if school is not found', async () => {
            mockSchoolModel.findById.mockResolvedValue(null);

            const result = await schoolManager.deleteSchool({
                schoolId: 'nonexistent-id',
                __longToken: { role: 'superadmin', userId: 'superadmin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('getSchoolAdmins', () => {
        it('should retrieve school admins successfully', async () => {
            const mockSchool = {
                _id: 'school-123',
                name: 'Test School'
            };

            const mockAdmins = [
                { _id: 'admin-1', username: 'admin1', role: 'school_admin' }
            ];

            mockSchoolModel.findById.mockResolvedValue(mockSchool);
            mockUserModel.find = jest.fn().mockResolvedValue(mockAdmins);

            const result = await schoolManager.getSchoolAdmins({
                schoolId: 'school-123',
                __longToken: { role: 'superadmin', userId: 'superadmin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
        });

        it('should fail if school is not found', async () => {
            mockSchoolModel.findById.mockResolvedValue(null);

            const result = await schoolManager.getSchoolAdmins({
                schoolId: 'nonexistent-id',
                __longToken: { role: 'superadmin', userId: 'superadmin-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('getSchoolStudents', () => {
        it('should retrieve school students with pagination', async () => {
            const mockSchool = {
                _id: 'school-123',
                name: 'Test School'
            };

            const mockStudents = [
                { _id: 'student-1', firstName: 'John', lastName: 'Doe' }
            ];

            mockSchoolModel.findById.mockResolvedValue(mockSchool);
            mockUserModel.find = jest.fn().mockResolvedValue(mockStudents);
            mockUserModel.countDocuments = jest.fn().mockResolvedValue(1);

            const result = await schoolManager.getSchoolStudents({
                schoolId: 'school-123',
                page: 1,
                limit: 20,
                __longToken: { role: 'superadmin', userId: 'superadmin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
        });
    });

    describe('getSchoolClassrooms', () => {
        it('should retrieve school classrooms successfully', async () => {
            const mockSchool = {
                _id: 'school-123',
                name: 'Test School'
            };

            const mockClassrooms = [
                { _id: 'classroom-1', name: 'Grade 5-A', grade: '5' }
            ];

            mockSchoolModel.findById.mockResolvedValue(mockSchool);
            const mockClassroomModel = {
                find: jest.fn().mockResolvedValue(mockClassrooms)
            };

            const result = await schoolManager.getSchoolClassrooms({
                schoolId: 'school-123',
                __longToken: { role: 'superadmin', userId: 'superadmin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
        });
    });

    describe('httpExposed methods', () => {
        it('should have all required HTTP exposed methods', () => {
            const requiredMethods = [
                'post=createSchool',
                'get=getSchoolById',
                'get=getAllSchools',
                'put=updateSchool',
                'delete=deleteSchool',
                'get=getSchoolAdmins',
                'get=getSchoolStudents',
                'get=getSchoolClassrooms'
            ];

            requiredMethods.forEach(method => {
                expect(schoolManager.httpExposed).toContain(method);
            });
        });
    });
});
