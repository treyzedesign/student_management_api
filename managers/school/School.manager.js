const { nanoid } = require('nanoid');
const schoolValidators = require('../../validators/schoolValidators');

module.exports = class SchoolManager {
    constructor({ utils, cache, config, cortex, managers, validators } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.managers = managers;
        this.cache = cache;
        this.utils = utils;
        
        // Import models
        this.SchoolModel = require('../../models/School.model');
        this.UserModel = require('../../models/User.model');
        
        // Expose public methods with HTTP methods
        this.httpExposed = [
            'post=createSchool',
            'get=getSchoolById',
            'get=getAllSchools',
            'put=updateSchool',
            'delete=deleteSchool',
            'get=getSchoolAdmins',
            'get=getSchoolStudents',
            'get=getSchoolClassrooms'
        ];
    }

    /**
     * @swagger
     * /api/school/createSchool:
     *   post:
     *     tags:
     *       - School
     *     summary: Create a new school
     *     description: Create a new school (Superadmin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/School'
     *     responses:
     *       201:
     *         description: School created successfully
     *       403:
     *         description: Access denied - only superadmins can create schools
     */
    async createSchool({ name, description, address, city, state, zipCode, phone, email, adminId, totalStudents, totalClassrooms, academicYear, __longToken }) {
        // Validation using schoolValidators
        const validationRules = schoolValidators.createSchoolValidationRules();
        
        if (!__longToken.role) {
            return { ok: false, code: 403, errors: 'Access denied. No role found in token.' };
        }
        
        if (__longToken.role !== 'superadmin') {
            return { ok: false, code: 403, errors: `Access denied. Only superadmins can create schools. Current role: ${__longToken.role}` };
        }
        
        console.log('✅ Authorization passed - User is superadmin');


        try {
            // Verify admin user exists and assign them to school
            const adminUser = await this.UserModel.findById(adminId);
            if (!adminUser) {
                return { ok: false, code: 404, errors: 'Administrator user not found.' };
            }

            // Create school
            const schoolId = nanoid();
            const school = new this.SchoolModel({
                _id: schoolId,
                name,
                description,
                address,
                city,
                state,
                zipCode,
                phone,
                email,
                adminId,
                academicYear,
                totalStudents,
                totalClassrooms
            });

            await school.save();

            // Update user role to school_admin and assign schoolId
            adminUser.role = 'school_admin';
            adminUser.schoolId = schoolId;
            await adminUser.save();

            // Cache the school
            await this.cache.key.set({
                key: `school:${schoolId}`,
                data: JSON.stringify(school.toObject()),
                ttl: 3600
            });

            return {
                ok: true,
                code: 201,
                data: {
                    school: school.toObject(),
                    message: 'School created successfully'
                }
            };
        } catch (error) {
            console.error('Error creating school:', error);
            
            // Handle duplicate key error with more details
            if(error.code === 11000){
                console.log('Duplicate key error details:', error.keyValue);
                console.log('Error message:', error.message);
                
                // Try to identify which field is duplicated
                if(error.message.includes('email')) {
                    return { ok: false, code: 409, errors: 'School with this email already exists.' };
                } else if(error.message.includes('name')) {
                    return { ok: false, code: 409, errors: 'School with this name already exists.' };
                } else if(error.message.includes('_id')) {
                    return { ok: false, code: 409, errors: 'School ID conflict. Please try again.' };
                } else {
                    return { ok: false, code: 409, errors: 'School already exists or data conflict.' };
                }
            }
            
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/school/getSchoolById:
     *   get:
     *     tags:
     *       - School
     *     summary: Get school by ID
     *     description: Retrieve a school by its ID
     *     parameters:
     *       - name: schoolId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: School retrieved successfully
     *       404:
     *         description: School not found
     */
    async getSchoolById({ schoolId }) {
        try {
            // Check cache first
            const cachedSchool = await this.cache.key.get({ key: `school:${schoolId}` });
            if (cachedSchool) {
                return {
                    ok: true,
                    code: 200,
                    data: JSON.parse(cachedSchool)
                };
            }

            const school = await this.SchoolModel.findById(schoolId);
            if (!school) {
                return { ok: false, code: 404, errors: 'School not found.' };
            }

            // Cache the school
            await this.cache.key.set({
                key: `school:${schoolId}`,
                data: JSON.stringify(school.toObject()),
                ttl: 3600
            });

            return {
                ok: true,
                code: 200,
                data: school.toObject()
            };
        } catch (error) {
            console.error('Error fetching school:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/school/getAllSchools:
     *   get:
     *     tags:
     *       - School
     *     summary: Get all schools
     *     description: Retrieve a paginated list of all schools
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: page
     *         in: query
     *         schema:
     *           type: number
     *           default: 1
     *       - name: limit
     *         in: query
     *         schema:
     *           type: number
     *           default: 10
     *     responses:
     *       200:
     *         description: Schools retrieved successfully
     *       401:
     *         description: Unauthorized
     */
    /**
     * Get all schools with pagination
     */
    async getAllSchools({ page = 1, limit = 10, __longToken }) {
        // Only superadmins can view all schools
        if (__longToken.role !== 'superadmin') {
            return { ok: false, code: 403, errors: 'Access denied.' };
        }

        try {
            const skip = (page - 1) * limit;
            const schools = await this.SchoolModel.find({ isActive: true })
                .limit(limit)
                .skip(skip)
                .sort({ createdAt: -1 });

            const total = await this.SchoolModel.countDocuments({ isActive: true });

            return {
                ok: true,
                code: 200,
                data: {
                    schools: schools.map(s => s.toObject()),
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            };
        } catch (error) {
            console.error('Error fetching schools:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/school/updateSchool:
     *   put:
     *     tags:
     *       - School
     *     summary: Update school information
     *     description: Update a school's details (Superadmin or School Admin only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: schoolId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               address:
     *                 type: string
     *               city:
     *                 type: string
     *               state:
     *                 type: string
     *               zipCode:
     *                 type: string
     *               phone:
     *                 type: string
     *               email:
     *                 type: string
     *               academicYear:
     *                 type: string
     *               isActive:
     *                 type: boolean
     *               totalStudents:
     *                 type: number
     *               totalClassrooms:
     *                 type: number
     *     responses:
     *       200:
     *         description: School updated successfully
     *       403:
     *         description: Access denied
     *       404:
     *         description: School not found
     */
    async updateSchool({ schoolId, name, description, address, city, state, zipCode, phone, email, isActive, totalStudents, totalClassrooms, academicYear, __longToken }) {
        try {
            // Authorization check
            if (__longToken.role !== 'superadmin' && (__longToken.role !== 'school_admin' || __longToken.schoolId !== schoolId)) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }
            console.log('sch_id: ', schoolId);
            
            const school = await this.SchoolModel.findById(schoolId);
            if (!school) {
                return { ok: false, code: 404, errors: 'School not found.' };
            }

            // Update fields if provided
            if (name) school.name = name;
            if (description) school.description = description;
            if (address) school.address = address;
            if (city) school.city = city;
            if (state) school.state = state;
            if (zipCode) school.zipCode = zipCode;
            if (phone) school.phone = phone;
            if (email) school.email = email;
            if (academicYear) school.academicYear = academicYear;
            if (isActive !== undefined) school.isActive = isActive;
            if (totalStudents !== undefined) school.totalStudents = totalStudents;
            if (totalClassrooms !== undefined) school.totalClassrooms = totalClassrooms;
            
            school.updatedAt = new Date();

            await school.save();

            // Invalidate cache
            await this.cache.key.delete({ key: `school:${schoolId}` });

            return {
                ok: true,
                code: 200,
                data: {
                    school: school.toObject(),
                    message: 'School updated successfully'
                }
            };
        } catch (error) {
            console.error('Error updating school:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/school/deleteSchool:
     *   delete:
     *     tags:
     *       - School
     *     summary: Delete a school
     *     description: Delete a school (Superadmin only)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: schoolId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: School deleted successfully
     *       403:
     *         description: Access denied
     *       404:
     *         description: School not found
     */
    async deleteSchool({ schoolId, __longToken }) {
        // Only superadmins can delete schools
        if (__longToken.role !== 'superadmin') {
            return { ok: false, code: 403, errors: 'Access denied.' };
        }

        try {
            const school = await this.SchoolModel.findById(schoolId);
            if (!school) {
                return { ok: false, code: 404, errors: 'School not found.' };
            }

            school.isActive = false;
            await school.save();

            // Invalidate cache
            await this.cache.key.delete({ key: `school:${schoolId}` });

            return {
                ok: true,
                code: 200,
                data: { message: 'School deleted successfully' }
            };
        } catch (error) {
            console.error('Error deleting school:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/school/getSchoolAdmins:
     *   get:
     *     tags:
     *       - School
     *     summary: Get school admins
     *     description: Get all admin users for a specific school
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: schoolId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: School admins retrieved successfully
     *       404:
     *         description: School not found
     */
    /**
     * Get school administrators
     */
    async getSchoolAdmins({ schoolId, __longToken }) {
        try {
            // Authorization check
            if (__longToken.role !== 'superadmin' && (__longToken.role !== 'school_admin' || __longToken.schoolId !== schoolId)) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            const admins = await this.UserModel.find({
                schoolId,
                role: 'school_admin',
                isActive: true
            });

            return {
                ok: true,
                code: 200,
                data: {
                    admins: admins.map(a => a.toJSON())
                }
            };
        } catch (error) {
            console.error('Error fetching admins:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/school/getSchoolStudents:
     *   get:
     *     tags:
     *       - School
     *     summary: Get school students
     *     description: Get all students for a specific school with pagination
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: schoolId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *       - name: page
     *         in: query
     *         schema:
     *           type: number
     *           default: 1
     *       - name: limit
     *         in: query
     *         schema:
     *           type: number
     *           default: 20
     *     responses:
     *       200:
     *         description: School students retrieved successfully
     *       404:
     *         description: School not found
     */
    async getSchoolStudents({ schoolId, page = 1, limit = 20, __longToken }) {
        try {
            // Authorization check
            if (__longToken.role !== 'superadmin' && (__longToken.role !== 'school_admin' || __longToken.schoolId !== schoolId)) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            const StudentModel = require('../../models/Student.model');
            const skip = (page - 1) * limit;

            const students = await StudentModel.find({
                schoolId,
                isActive: true
            })
                .limit(limit)
                .skip(skip)
                .sort({ createdAt: -1 });

            const total = await StudentModel.countDocuments({
                schoolId,
                isActive: true
            });

            return {
                ok: true,
                code: 200,
                data: {
                    students,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            };
        } catch (error) {
            console.error('Error fetching students:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/school/getSchoolClassrooms:
     *   get:
     *     tags:
     *       - School
     *     summary: Get school classrooms
     *     description: Get all classrooms for a specific school
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: schoolId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: School classrooms retrieved successfully
     *       404:
     *         description: School not found
     */
    async getSchoolClassrooms({ schoolId, __longToken }) {
        try {
            // Authorization check
            if (__longToken.role !== 'superadmin' && (__longToken.role !== 'school_admin' || __longToken.schoolId !== schoolId)) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            const ClassroomModel = require('../../models/Classroom.model');

            const classrooms = await ClassroomModel.find({
                schoolId,
                isActive: true
            }).sort({ grade: 1, section: 1 });

            return {
                ok: true,
                code: 200,
                data: {
                    classrooms
                }
            };
        } catch (error) {
            console.error('Error fetching classrooms:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }
};
