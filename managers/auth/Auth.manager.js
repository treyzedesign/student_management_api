const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');

module.exports = class AuthManager {
    constructor({ utils, cache, config, cortex, managers, validators } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.managers = managers;
        this.cache = cache;
        this.utils = utils;

        // Import models
        this.UserModel = require('../../models/User.model');
        this.SchoolModel = require('../../models/School.model');

        // Expose public methods with HTTP methods
        this.httpExposed = [
            'post=registerSuperAdmin',
            'post=registerSchoolAdmin',
            'post=registerStudentUser',
            'post=login',
            'get=getProfile',
            'put=updateProfile',
            'post=changePassword',
            'post=logout'
        ];
    }

    /**
     * Validate registration credentials
     */
    validateRegister({ username, email, password }) {
        if (!username || username.length < 3) {
            return { ok: false, code: 400, errors: 'Username must be at least 3 characters.' };
        }
        if (!email || !email.includes('@')) {
            return { ok: false, code: 400, errors: 'Valid email is required.' };
        }
        if (!password || password.length < 6) {
            return { ok: false, code: 400, errors: 'Password must be at least 6 characters.' };
        }
        return null;
    }

    /**
     * Validate login credentials
     */
    validateLogin({ username, password }) {
        if (!username || !password) {
            return { ok: false, code: 400, errors: 'Username and password are required.' };
        }
        return null;
    }

    /**
     * @swagger
     * /api/auth/registerSuperAdmin:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Register a superadmin (Initial setup only)
     *     description: Create the first superadmin user. Can only be done once.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - username
     *               - email
     *               - password
     *               - confirmPassword
     *             properties:
     *               username:
     *                 type: string
     *                 example: admin
     *               email:
     *                 type: string
     *                 format: email
     *                 example: admin@example.com
     *               password:
     *                 type: string
     *                 format: password
     *               confirmPassword:
     *                 type: string
     *                 format: password
     *     responses:
     *       201:
     *         description: Superadmin registered successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:
     *                   type: boolean
     *                 code:
     *                   type: number
     *                 data:
     *                   type: object
     *       400:
     *         description: Validation error or superadmin already exists
     *       500:
     *         description: Server error
     */
    async registerSuperAdmin({ username, email, password, confirmPassword }) {
        try {
            // Check if any superadmin already exists
            const existingSuperAdmin = await this.UserModel.findOne({ role: 'superadmin' });
            if (existingSuperAdmin) {
                return { ok: false, code: 400, errors: 'Superadmin already exists!' };
            }

            // Validation
            if (password !== confirmPassword) {
                return { ok: false, code: 400, errors: 'Passwords do not match.' };
            }

            const validationError = this.validateRegister({ username, email, password });
            if (validationError) return validationError;

            // Check if username or email exists
            const existingUser = await this.UserModel.findOne({
                $or: [{ username }, { email }]
            });
            if (existingUser) {
                return { ok: false, code: 400, errors: 'Username or email already in use.' };
            }

            // Create user
            const user = new this.UserModel({
                _id: nanoid(),
                username,
                email,
                password,
                role: 'superadmin'
            });

            await user.save();

            const longToken = this.managers.token.genLongToken({
                userId: user._id,
                userKey: nanoid(),
                role: user.role
            });

            return {
                ok: true,
                code: 201,
                data: {
                    user: user.toJSON(),
                    longToken,
                    message: 'Superadmin registered successfully'
                }
            };
        } catch (error) {
            console.error('Error registering superadmin:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/auth/registerSchoolAdmin:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Register a school admin
     *     description: Create a school admin user (Superadmin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - username
     *               - email
     *               - password
     *               - confirmPassword
     *               - schoolId
     *             properties:
     *               username:
     *                 type: string
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *                 format: password
     *               confirmPassword:
     *                 type: string
     *                 format: password
     *               schoolId:
     *                 type: string
     *     responses:
     *       201:
     *         description: School admin registered successfully
     *       403:
     *         description: Access denied - only superadmins can create school admins
     *       400:
     *         description: Validation error or user already exists
     */
    async registerSchoolAdmin({ username, email, password, confirmPassword, schoolId, __longToken }) {
        // Authorization check
        if (__longToken.role !== 'superadmin') {
            return { ok: false, code: 403, errors: 'Access denied. Only superadmins can create school admins.' };
        }

        try {
            // Validation
            if (password !== confirmPassword) {
                return { ok: false, code: 400, errors: 'Passwords do not match.' };
            }

            const validationError = this.validateRegister({ username, email, password });
            if (validationError) return validationError;

            // Check if username or email exists
            const existingUser = await this.UserModel.findOne({
                $or: [{ username }, { email }]
            });
            if (existingUser) {
                return { ok: false, code: 400, errors: 'Username or email already in use.' };
            }

            // Verify school exists if schoolId provided
            if (schoolId) {
                const school = await this.SchoolModel.findById(schoolId);
                if (!school) {
                    return { ok: false, code: 404, errors: 'School not found.' };
                }
            }

            // Create user
            const user = new this.UserModel({
                _id: nanoid(),
                username,
                email,
                password,
                role: 'school_admin',
                schoolId: schoolId || null
            });

            await user.save();

            const longToken = this.managers.token.genLongToken({
                userId: user._id,
                userKey: nanoid(),
                role: user.role,
                schoolId: schoolId || null
            });

            return {
                ok: true,
                code: 201,
                data: {
                    user: user.toJSON(),
                    longToken,
                    message: 'School admin created successfully'
                }
            };
        } catch (error) {
            console.error('Error registering school admin:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/auth/registerStudentUser:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Register student user account
     *     description: Create a student user account for authentication. Then enroll them in a classroom via the enrollStudent endpoint.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - username
     *               - email
     *               - password
     *               - confirmPassword
     *             properties:
     *               username:
     *                 type: string
     *               email:
     *                 type: string
     *                 format: email
     *               password:
     *                 type: string
     *                 format: password
     *               confirmPassword:
     *                 type: string
     *                 format: password
     *     responses:
     *       201:
     *         description: Student user account created successfully. Use the userId to enroll in a classroom.
     *       403:
     *         description: Access denied - only school admins can create student accounts
     *       400:
     *         description: Validation error
     */
    async registerStudentUser({ username, email, password, confirmPassword, __longToken }) {
        // Authorization check
        if (__longToken.role !== 'school_admin') {
            return { ok: false, code: 403, errors: 'Access denied. Only school admins can create student accounts.' };
        }

        try {
            // Validation
            if (password !== confirmPassword) {
                return { ok: false, code: 400, errors: 'Passwords do not match.' };
            }

            const validationError = this.validateRegister({ username, email, password });
            if (validationError) return validationError;

            // Check if username or email exists
            const existingUser = await this.UserModel.findOne({
                $or: [{ username }, { email }]
            });
            if (existingUser) {
                return { ok: false, code: 400, errors: 'Username or email already in use.' };
            }

            // Create user (no schoolId/enrollment yet)
            const user = new this.UserModel({
                _id: nanoid(),
                username,
                email,
                password,
                role: 'student'
            });

            await user.save();

            const longToken = this.managers.token.genLongToken({
                userId: user._id,
                userKey: nanoid(),
                role: user.role
            });

            return {
                ok: true,
                code: 201,
                data: {
                    user: user.toJSON(),
                    longToken,
                    message: 'Student user account created successfully. Use userId to enroll in a classroom.'
                }
            };
        } catch (error) {
            console.error('Error registering student user:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Login user
     *     description: Authenticate a user and get JWT tokens
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - username
     *               - password
     *             properties:
     *               username:
     *                 type: string
     *               password:
     *                 type: string
     *                 format: password
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ok:
     *                   type: boolean
     *                 longToken:
     *                   type: string
     *                 shortToken:
     *                   type: string
     *       400:
     *         description: Invalid credentials
     *       500:
     *         description: Server error
     */
    async login({ username, password }) {
        try {
            // Validation
            if (!username || !password) {
                return { ok: false, code: 400, errors: 'Username and password are required.' };
            }

            // Find user by username
            const user = await this.UserModel.findOne({ username }).select('+password');
            if (!user || !user.isActive) {
                return { ok: false, code: 401, errors: 'Invalid username or password.' };
            }

            // Compare password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return { ok: false, code: 401, errors: 'Invalid username or password.' };
            }

            // Update last login
            user.lastLogin = new Date();
            await user.save();

            // Generate tokens
            const longToken = this.managers.token.genLongToken({
                userId: user._id,
                userKey: nanoid(),
                role: user.role,
                schoolId: user.schoolId
            });

            // Cache the user session
            await this.cache.key.set({
                key: `user:${user._id}`,
                data: JSON.stringify({
                    userId: user._id,
                    role: user.role,
                    schoolId: user.schoolId,
                    lastLogin: user.lastLogin
                }),
                ttl: 86400 // 24 hours
            });

            return {
                ok: true,
                code: 200,
                data: {
                    user: user.toJSON(),
                    longToken,
                    message: 'Login successful'
                }
            };
        } catch (error) {
            console.error('Error logging in:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/auth/getProfile:
     *   get:
     *     tags:
     *       - Auth
     *     summary: Get user profile
     *     description: Retrieve the authenticated user's profile information
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: User profile retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: User not found
     */
    async getProfile({ __longToken }) {
        try {
            const user = await this.UserModel.findById(__longToken.userId);
            if (!user) {
                return { ok: false, code: 404, errors: 'User not found.' };
            }

            return {
                ok: true,
                code: 200,
                data: {
                    user: user.toJSON()
                }
            };
        } catch (error) {
            console.error('Error fetching profile:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/auth/updateProfile:
     *   put:
     *     tags:
     *       - Auth
     *     summary: Update user profile
     *     description: Update the authenticated user's profile information
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               username:
     *                 type: string
     *               email:
     *                 type: string
     *                 format: email
     *     responses:
     *       200:
     *         description: Profile updated successfully
     *       401:
     *         description: Unauthorized
     *       400:
     *         description: Validation error
     */
    async updateProfile({ username, email, __longToken }) {
        try {
            const user = await this.UserModel.findById(__longToken.userId);
            if (!user) {
                return { ok: false, code: 404, errors: 'User not found.' };
            }

            // Check if new email already in use
            if (email && email !== user.email) {
                const existingUser = await this.UserModel.findOne({ email });
                if (existingUser) {
                    return { ok: false, code: 400, errors: 'Email already in use.' };
                }
            }

            if (username) user.username = username;
            if (email) user.email = email;
            user.updatedAt = new Date();

            await user.save();

            return {
                ok: true,
                code: 200,
                data: {
                    user: user.toJSON(),
                    message: 'Profile updated successfully'
                }
            };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/auth/changePassword:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Change user password
     *     description: Change the authenticated user's password
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - currentPassword
     *               - newPassword
     *               - confirmPassword
     *             properties:
     *               currentPassword:
     *                 type: string
     *                 format: password
     *               newPassword:
     *                 type: string
     *                 format: password
     *               confirmPassword:
     *                 type: string
     *                 format: password
     *     responses:
     *       200:
     *         description: Password changed successfully
     *       401:
     *         description: Unauthorized or incorrect current password
     *       400:
     *         description: Validation error
     */
    async changePassword({ currentPassword, newPassword, confirmPassword, __longToken }) {
        try {
            if (newPassword !== confirmPassword) {
                return { ok: false, code: 400, errors: 'Passwords do not match.' };
            }

            const user = await this.UserModel.findById(__longToken.userId).select('+password');
            if (!user) {
                return { ok: false, code: 404, errors: 'User not found.' };
            }

            // Verify current password
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                return { ok: false, code: 401, errors: 'Current password is incorrect.' };
            }

            // Update password
            user.password = newPassword;
            user.updatedAt = new Date();
            await user.save();

            return {
                ok: true,
                code: 200,
                data: {
                    message: 'Password changed successfully'
                }
            };
        } catch (error) {
            console.error('Error changing password:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/auth/logout:
     *   post:
     *     tags:
     *       - Auth
     *     summary: Logout user
     *     description: Logout the authenticated user
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logout successful
     *       401:
     *         description: Unauthorized
     */
    async logout({ __longToken }) {
        try {
            // Invalidate user cache/session
            await this.cache.key.delete({ key: `user:${__longToken.userId}` });

            return {
                ok: true,
                code: 200,
                data: {
                    message: 'Logout successful'
                }
            };
        } catch (error) {
            console.error('Error logging out:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }
};
