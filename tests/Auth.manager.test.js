/**
 * Auth Manager Test Suite
 * Tests for user authentication and registration endpoints
 */
const AuthManager = require('../managers/auth/Auth.manager');

describe('AuthManager', () => {
    let authManager;
    let mockUtils, mockCache, mockConfig, mockCortex, mockManagers, mockValidators;
    let mockUserModel;

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

        // Mock User Model as a constructor
        mockUserModel = jest.fn();
        mockUserModel.findById = jest.fn();
        mockUserModel.findOne = jest.fn();
        mockUserModel.create = jest.fn();
        mockUserModel.countDocuments = jest.fn();

        // Mock School Model
        const mockSchoolModel = jest.fn();
        mockSchoolModel.findById = jest.fn();

        // Create AuthManager instance
        authManager = new AuthManager({
            utils: mockUtils,
            cache: mockCache,
            config: mockConfig,
            cortex: mockCortex,
            managers: mockManagers,
            validators: mockValidators
        });

        // Override model imports
        authManager.UserModel = mockUserModel;
        authManager.SchoolModel = mockSchoolModel;
    });

    describe('validateRegister', () => {
        it('should return error if username is missing or too short', () => {
            const result = authManager.validateRegister({
                username: 'ab',
                email: 'test@example.com',
                password: 'password123'
            });
            expect(result).toBeDefined();
            expect(result.ok).toBe(false);
        });

        it('should return error if email is invalid', () => {
            const result = authManager.validateRegister({
                username: 'testuser',
                email: 'invalid-email',
                password: 'password123'
            });
            expect(result).toBeDefined();
            expect(result.ok).toBe(false);
        });

        it('should return error if password is too short', () => {
            const result = authManager.validateRegister({
                username: 'testuser',
                email: 'test@example.com',
                password: 'short'
            });
            expect(result).toBeDefined();
            expect(result.ok).toBe(false);
        });

        it('should return null for valid credentials', () => {
            const result = authManager.validateRegister({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });
            expect(result).toBeNull();
        });
    });

    describe('validateLogin', () => {
        it('should return error if username or password is missing', () => {
            const result = authManager.validateLogin({
                username: 'testuser',
                password: ''
            });
            expect(result).toBeDefined();
            expect(result.ok).toBe(false);
        });

        it('should return null for valid login credentials', () => {
            const result = authManager.validateLogin({
                username: 'testuser',
                password: 'password123'
            });
            expect(result).toBeNull();
        });
    });

    describe('registerSuperAdmin', () => {
        it('should register superadmin successfully on first call', async () => {
            mockUserModel.countDocuments.mockResolvedValue(0);
            
            const mockUserInstance = {
                _id: 'admin-id',
                username: 'admin',
                email: 'admin@example.com',
                role: 'superadmin',
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'admin-id',
                    username: 'admin',
                    email: 'admin@example.com',
                    role: 'superadmin'
                })
            };

            mockUserModel.mockImplementation(() => mockUserInstance);

            const result = await authManager.registerSuperAdmin({
                username: 'admin',
                email: 'admin@example.com',
                password: 'SecurePassword123',
                confirmPassword: 'SecurePassword123'
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(201);
            expect(result.data.user.role).toBe('superadmin');
        });

        it('should fail if superadmin already exists', async () => {
            mockUserModel.countDocuments.mockResolvedValue(1);

            const result = await authManager.registerSuperAdmin({
                username: 'admin',
                email: 'admin@example.com',
                password: 'SecurePassword123',
                confirmPassword: 'SecurePassword123'
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(400);
        });

        it('should fail if passwords do not match', async () => {
            const result = await authManager.registerSuperAdmin({
                username: 'admin',
                email: 'admin@example.com',
                password: 'SecurePassword123',
                confirmPassword: 'DifferentPassword123'
            });

            expect(result.ok).toBe(false);
        });
    });

    describe('registerSchoolAdmin', () => {
        it('should register school admin successfully with proper authorization', async () => {
            const mockAdmin = {
                _id: 'school-admin-id',
                username: 'schooladmin',
                email: 'admin@school.com',
                role: 'school_admin',
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'school-admin-id',
                    username: 'schooladmin',
                    email: 'admin@school.com',
                    role: 'school_admin'
                })
            };

            mockUserModel.mockImplementation(() => mockAdmin);

            const result = await authManager.registerSchoolAdmin({
                username: 'schooladmin',
                email: 'admin@school.com',
                password: 'SecurePassword123',
                confirmPassword: 'SecurePassword123',
                schoolId: 'school-123',
                __longToken: { role: 'superadmin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(201);
        });

        it('should deny access if user is not superadmin', async () => {
            const result = await authManager.registerSchoolAdmin({
                username: 'schooladmin',
                email: 'admin@school.com',
                password: 'SecurePassword123',
                confirmPassword: 'SecurePassword123',
                schoolId: 'school-123',
                __longToken: { role: 'school_admin', userId: 'user-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(403);
        });
    });

    describe('registerStudentUser', () => {
        it('should register student user successfully with school admin authorization', async () => {
            const mockStudent = {
                _id: 'student-user-id',
                username: 'student1',
                email: 'student@school.com',
                role: 'student',
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'student-user-id',
                    username: 'student1',
                    email: 'student@school.com',
                    role: 'student'
                })
            };

            mockUserModel.mockImplementation(() => mockStudent);

            const result = await authManager.registerStudentUser({
                username: 'student1',
                email: 'student@school.com',
                password: 'SecurePassword123',
                confirmPassword: 'SecurePassword123',
                __longToken: { role: 'school_admin', userId: 'admin-id' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(201);
            expect(result.data.user.role).toBe('student');
        });

        it('should deny access if user is not school admin', async () => {
            const result = await authManager.registerStudentUser({
                username: 'student1',
                email: 'student@school.com',
                password: 'SecurePassword123',
                confirmPassword: 'SecurePassword123',
                __longToken: { role: 'student', userId: 'student-id' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(403);
        });
    });

    describe('login', () => {
        it('should login successfully with correct credentials', async () => {
            const mockUser = {
                _id: 'user-id',
                username: 'testuser',
                password: '$2b$10$mockhashedpassword',
                role: 'student',
                toObject: jest.fn().mockReturnValue({
                    _id: 'user-id',
                    username: 'testuser',
                    role: 'student'
                })
            };

            mockUserModel.findOne.mockResolvedValue(mockUser);

            const result = await authManager.login({
                username: 'testuser',
                password: 'password123'
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
            expect(result.data).toHaveProperty('longToken');
            expect(result.data).toHaveProperty('shortToken');
        });

        it('should fail login with incorrect password', async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            const result = await authManager.login({
                username: 'testuser',
                password: 'wrongpassword'
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(400);
        });

        it('should fail login if user does not exist', async () => {
            mockUserModel.findOne.mockResolvedValue(null);

            const result = await authManager.login({
                username: 'nonexistent',
                password: 'password123'
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(400);
        });
    });

    describe('getProfile', () => {
        it('should retrieve user profile successfully', async () => {
            const mockUser = {
                _id: 'user-id',
                username: 'testuser',
                email: 'test@example.com',
                role: 'student',
                toObject: jest.fn().mockReturnValue({
                    _id: 'user-id',
                    username: 'testuser',
                    email: 'test@example.com',
                    role: 'student'
                })
            };

            mockUserModel.findById.mockResolvedValue(mockUser);

            const result = await authManager.getProfile({
                __longToken: { userId: 'user-id', role: 'student' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
            expect(result.data.username).toBe('testuser');
        });

        it('should fail if user is not found', async () => {
            mockUserModel.findById.mockResolvedValue(null);

            const result = await authManager.getProfile({
                __longToken: { userId: 'nonexistent-id', role: 'student' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('updateProfile', () => {
        it('should update user profile successfully', async () => {
            const mockUser = {
                _id: 'user-id',
                username: 'testuser',
                email: 'test@example.com',
                role: 'student',
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'user-id',
                    username: 'newusername',
                    email: 'newemail@example.com',
                    role: 'student'
                })
            };

            mockUserModel.findById.mockResolvedValue(mockUser);

            const result = await authManager.updateProfile({
                username: 'newusername',
                email: 'newemail@example.com',
                __longToken: { userId: 'user-id', role: 'student' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
        });

        it('should fail if user is not found', async () => {
            mockUserModel.findById.mockResolvedValue(null);

            const result = await authManager.updateProfile({
                username: 'newusername',
                email: 'newemail@example.com',
                __longToken: { userId: 'nonexistent-id', role: 'student' }
            });

            expect(result.ok).toBe(false);
            expect(result.code).toBe(404);
        });
    });

    describe('changePassword', () => {
        it('should change password successfully with correct current password', async () => {
            const mockUser = {
                _id: 'user-id',
                username: 'testuser',
                password: '$2b$10$mockhashedpassword',
                save: jest.fn().mockResolvedValue(true),
                toObject: jest.fn().mockReturnValue({
                    _id: 'user-id',
                    username: 'testuser'
                })
            };

            mockUserModel.findById.mockResolvedValue(mockUser);

            const result = await authManager.changePassword({
                currentPassword: 'oldpassword',
                newPassword: 'newpassword123',
                confirmPassword: 'newpassword123',
                __longToken: { userId: 'user-id', role: 'student' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
        });

        it('should fail if new passwords do not match', async () => {
            const result = await authManager.changePassword({
                currentPassword: 'oldpassword',
                newPassword: 'newpassword123',
                confirmPassword: 'differentpassword123',
                __longToken: { userId: 'user-id', role: 'student' }
            });

            expect(result.ok).toBe(false);
        });
    });

    describe('logout', () => {
        it('should logout user successfully', async () => {
            const result = await authManager.logout({
                __longToken: { userId: 'user-id', role: 'student' }
            });

            expect(result.ok).toBe(true);
            expect(result.code).toBe(200);
        });
    });

    describe('httpExposed methods', () => {
        it('should have all required HTTP exposed methods', () => {
            const requiredMethods = [
                'post=registerSuperAdmin',
                'post=registerSchoolAdmin',
                'post=registerStudentUser',
                'post=login',
                'get=getProfile',
                'put=updateProfile',
                'post=changePassword',
                'post=logout'
            ];

            requiredMethods.forEach(method => {
                expect(authManager.httpExposed).toContain(method);
            });
        });
    });
});
