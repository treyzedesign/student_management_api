const { nanoid } = require('nanoid');
const classroomValidators = require('../../validators/classroomValidators');

module.exports = class ClassroomManager {
    constructor({ utils, cache, config, cortex, managers, validators } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.managers = managers;
        this.cache = cache;
        this.utils = utils;

        // Import models
        this.ClassroomModel = require('../../models/Classroom.model');
        this.SchoolModel = require('../../models/School.model');
        this.StudentModel = require('../../models/Student.model');

        // Expose public methods with HTTP methods
        this.httpExposed = [
            'post=createClassroom',
            'get=getClassroomById',
            'get=getSchoolClassrooms',
            'put=updateClassroom',
            'delete=deleteClassroom',
            'get=getClassroomStudents',
            'post=addResourceToClassroom',
            'put=updateClassroomCapacity'
        ];
    }

    /**
     * Helper method to validate input using express-validator rules
     */
    validateInput(data, rules) {
        const errors = [];
        
        for (const rule of rules) {
            // Extract field name from the rule
            const fieldPath = rule.builder.path || rule.builder._path;
            const fieldName = Array.isArray(fieldPath) ? fieldPath[0] : fieldPath;
            const fieldValue = data[fieldName];
            
            if (!fieldValue && rule.builder.optional) {
                continue;
            }
            
            // Required field validation
            if (rule.builder.notEmpty && !fieldValue) {
                errors.push({ field: fieldName, message: `${fieldName} is required` });
                continue;
            }
            
            if (fieldValue) {
                // Length validation
                if (rule.builder.isLength) {
                    const { min, max } = rule.builder.isLength;
                    if (min && fieldValue.length < min) {
                        errors.push({ field: fieldName, message: `${fieldName} must be at least ${min} characters` });
                    }
                    if (max && fieldValue.length > max) {
                        errors.push({ field: fieldName, message: `${fieldName} must not exceed ${max} characters` });
                    }
                }
                
                // Integer validation
                if (rule.builder.isInt) {
                    const { min, max } = rule.builder.isInt;
                    const value = parseInt(fieldValue);
                    if (min && value < min) {
                        errors.push({ field: fieldName, message: `${fieldName} must be at least ${min}` });
                    }
                    if (max && value > max) {
                        errors.push({ field: fieldName, message: `${fieldName} must not exceed ${max}` });
                    }
                }
                
                // Regex validation
                if (rule.builder.matches) {
                    if (!rule.builder.matches.pattern.test(fieldValue)) {
                        errors.push({ field: fieldName, message: rule.builder.errorMessage || `${fieldName} format is invalid` });
                    }
                }
                
                // UUID validation
                if (rule.builder.isUUID && fieldValue) {
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                    if (!uuidRegex.test(fieldValue)) {
                        errors.push({ field: fieldName, message: `${fieldName} must be a valid UUID` });
                    }
                }
                
                // Email validation
                if (rule.builder.isEmail && fieldValue) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(fieldValue)) {
                        errors.push({ field: fieldName, message: `${fieldName} must be a valid email address` });
                    }
                }
                
                // Alphanumeric validation
                if (rule.builder.isAlphanumeric && fieldValue) {
                    if (!/^[a-zA-Z0-9]+$/.test(fieldValue)) {
                        errors.push({ field: fieldName, message: `${fieldName} must be alphanumeric` });
                    }
                }
                
                // Alpha validation
                if (rule.builder.isAlpha && fieldValue) {
                    if (!/^[a-zA-Z]+$/.test(fieldValue)) {
                        errors.push({ field: fieldName, message: `${fieldName} must contain only letters` });
                    }
                }
            }
        }
        
        if (errors.length > 0) {
            return { 
                ok: false, 
                code: 400, 
                errors: errors.map(err => err.message).join(', '),
                validationErrors: errors
            };
        }
        
        return null;
    }

    /**
     * @swagger
     * /api/classroom/createClassroom:
     *   post:
     *     tags:
     *       - Classroom
     *     summary: Create a new classroom
     *     description: Create a new classroom in a school (School Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - schoolId
     *               - name
     *               - grade
     *               - section
     *               - capacity
     *               - academicYear
     *             properties:
     *               schoolId:
     *                 type: string
     *                 description: School ID where classroom will be created
     *               name:
     *                 type: string
     *                 description: Classroom name (e.g., "Grade 5-A")
     *               grade:
     *                 type: string
     *                 description: Grade level (e.g., "5", "10", "12")
     *               section:
     *                 type: string
     *                 description: Section identifier (e.g., "A", "B", "C")
     *               capacity:
     *                 type: number
     *                 minimum: 1
     *                 description: Maximum number of students
     *               room:
     *                 type: string
     *                 description: Room number or location
     *               academicYear:
     *                 type: string
     *                 description: Academic year
     *               teacherId:
     *                 type: string
     *                 description: Assigned teacher ID (optional)
     *               schedule:
     *                 type: object
     *                 example: { "days": ["Monday", "Wednesday", "Friday"], "startTime": "09:00", "endTime": "10:30" }
     *                 description: Class schedule (optional)
     *     responses:
     *       201:
     *         description: Classroom created successfully
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
     *                   properties:
     *                     classroom:
     *                       $ref: '#/components/schemas/Classroom'
     *                     message:
     *                       type: string
     *       403:
     *         description: Access denied - only school admins can create classrooms
     *       404:
     *         description: School not found
     *       400:
     *         description: Validation error
     */
    async createClassroom({ 
        schoolId, name, grade, section, capacity, room, academicYear, 
        teacherId, schedule, __longToken 
    }) {
        // Authorization check - only school admins can create classrooms
        if (__longToken.role !== 'school_admin' || __longToken.schoolId !== schoolId) {
            return { ok: false, code: 403, errors: 'Access denied. Only school admins can create classrooms.' };
        }
        // Validation using classroomValidators
        const validationRules = classroomValidators.createClassroomValidationRules();
        const validationError = this.validateInput({ schoolId, name, grade, section, capacity, room, academicYear }, validationRules);
        if (validationError) return validationError;

        try {
            // Verify school exists
            const school = await this.SchoolModel.findById(schoolId);
            if (!school) {
                return { ok: false, code: 404, errors: 'School not found.' };
            }

            // Create classroom
            const classroomId = nanoid();
            const classroom = new this.ClassroomModel({
                _id: classroomId,
                schoolId,
                name,
                grade,
                section,
                capacity,
                room,
                academicYear,
                teacherId: teacherId || null,
                schedule: schedule || {},
                currentEnrollment: 0
            });

            await classroom.save();

            // Update school's classroom count
            school.totalClassrooms += 1;
            await school.save();

            // Cache the classroom
            await this.cache.key.set({
                key: `classroom:${classroomId}`,
                data: JSON.stringify(classroom.toObject()),
                ttl: 3600
            });

            return {
                ok: true,
                code: 201,
                data: {
                    classroom: classroom.toObject(),
                    message: 'Classroom created successfully'
                }
            };
        } catch (error) {
            console.error('Error creating classroom:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/classroom/getClassroomById:
     *   get:
     *     tags:
     *       - Classroom
     *     summary: Get classroom by ID
     *     description: Retrieve a classroom's information by its ID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: classroomId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *         description: Classroom ID
     *     responses:
     *       200:
     *         description: Classroom retrieved successfully
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
     *                   $ref: '#/components/schemas/Classroom'
     *       403:
     *         description: Access denied
     *       404:
     *         description: Classroom not found
     */
    async getClassroomById({ classroomId, __longToken }) {
        // Validation using Express validator
        const validationRules = classroomValidators.getClassroomByIdValidationRules();

        const validationError = this.validateInput({ classroomId }, validationRules);
        if (validationError) return validationError;

        try {
            // Check cache first
            const cachedClassroom = await this.cache.key.get({ key: `classroom:${classroomId}` });
            if (cachedClassroom) {
                const classroom = JSON.parse(cachedClassroom);
                // Verify authorization
                if (__longToken.role === 'school_admin' && __longToken.schoolId !== classroom.schoolId) {
                    return { ok: false, code: 403, errors: 'Access denied.' };
                }
                return { ok: true, code: 200, data: classroom };
            }

            const classroom = await this.ClassroomModel.findById(classroomId);
            if (!classroom) {
                return { ok: false, code: 404, errors: 'Classroom not found.' };
            }

            // Verify authorization
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== classroom.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            // Cache the classroom
            await this.cache.key.set({
                key: `classroom:${classroomId}`,
                data: JSON.stringify(classroom.toObject()),
                ttl: 3600
            });

            return {
                ok: true,
                code: 200,
                data: classroom.toObject()
            };
        } catch (error) {
            console.error('Error fetching classroom:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/classroom/getSchoolClassrooms:
     *   get:
     *     tags:
     *       - Classroom
     *     summary: Get classrooms by school
     *     description: Get all classrooms for a specific school with optional filtering
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: schoolId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *         description: School ID
     *       - name: page
     *         in: query
     *         schema:
     *           type: number
     *           default: 1
     *         description: Page number for pagination
     *       - name: limit
     *         in: query
     *         schema:
     *           type: number
     *           default: 10
     *         description: Number of classrooms per page
     *       - name: grade
     *         in: query
     *         schema:
     *           type: string
     *         description: Filter by grade level (optional)
     *     responses:
     *       200:
     *         description: Classrooms retrieved successfully
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
     *                   properties:
     *                     classrooms:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Classroom'
     *                     pagination:
     *                       $ref: '#/components/schemas/Pagination'
     *       403:
     *         description: Access denied
     */
    async getSchoolClassrooms({ schoolId, page = 1, limit = 10, grade, __longToken }) {
        try {
            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            const skip = (page - 1) * limit;
            let query = { schoolId, isActive: true };

            if (grade) {
                query.grade = grade;
            }

            const classrooms = await this.ClassroomModel.find(query)
                .limit(limit)
                .skip(skip)
                .sort({ grade: 1, section: 1 });

            const total = await this.ClassroomModel.countDocuments(query);

            return {
                ok: true,
                code: 200,
                data: {
                    classrooms: classrooms.map(c => c.toObject()),
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            };
        } catch (error) {
            console.error('Error fetching classrooms:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/classroom/updateClassroom:
     *   put:
     *     tags:
     *       - Classroom
     *     summary: Update classroom information
     *     description: Update a classroom's details
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: classroomId
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
     *                 description: Classroom name
     *               grade:
     *                 type: string
     *                 description: Grade level
     *               section:
     *                 type: string
     *                 description: Section identifier
     *               capacity:
     *                 type: number
     *                 description: Maximum number of students
     *               room:
     *                 type: string
     *                 description: Room number or location
     *               teacherId:
     *                 type: string
     *                 description: Assigned teacher ID
     *               schedule:
     *                 type: object
     *                 description: Class schedule
     *     responses:
     *       200:
     *         description: Classroom updated successfully
     *       403:
     *         description: Access denied
     *       404:
     *         description: Classroom not found
     */
    async updateClassroom({ 
        classroomId, name, grade, section, capacity, room, teacherId, schedule, __longToken 
    }) {
        try {
            const classroom = await this.ClassroomModel.findById(classroomId);
            if (!classroom) {
                return { ok: false, code: 404, errors: 'Classroom not found.' };
            }

            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== classroom.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            // Update fields
            if (name) classroom.name = name;
            if (grade) classroom.grade = grade;
            if (section) classroom.section = section;
            if (capacity) classroom.capacity = capacity;
            if (room) classroom.room = room;
            if (teacherId) classroom.teacherId = teacherId;
            if (schedule) classroom.schedule = schedule;

            classroom.updatedAt = new Date();
            await classroom.save();

            // Invalidate cache
            await this.cache.key.delete({ key: `classroom:${classroomId}` });

            return {
                ok: true,
                code: 200,
                data: {
                    classroom: classroom.toObject(),
                    message: 'Classroom updated successfully'
                }
            };
        } catch (error) {
            console.error('Error updating classroom:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/classroom/deleteClassroom:
     *   delete:
     *     tags:
     *       - Classroom
     *     summary: Delete classroom
     *     description: Delete a classroom (soft delete). Only possible if no students are enrolled.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: classroomId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *         description: Classroom ID to delete
     *     responses:
     *       200:
     *         description: Classroom deleted successfully
     *       403:
     *         description: Access denied
     *       404:
     *         description: Classroom not found
     *       400:
     *         description: Cannot delete classroom with enrolled students
     */
    async deleteClassroom({ classroomId, __longToken }) {
        try {
            const classroom = await this.ClassroomModel.findById(classroomId);
            if (!classroom) {
                return { ok: false, code: 404, errors: 'Classroom not found.' };
            }

            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== classroom.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            // Check if classroom has students
            if (classroom.currentEnrollment > 0) {
                return { 
                    ok: false, 
                    code: 400, 
                    errors: 'Cannot delete classroom with enrolled students. Transfer all students first.' 
                };
            }

            classroom.isActive = false;
            await classroom.save();

            // Invalidate cache
            await this.cache.key.delete({ key: `classroom:${classroomId}` });

            // Update school's classroom count
            const school = await this.SchoolModel.findById(classroom.schoolId);
            if (school) {
                school.totalClassrooms = Math.max(0, school.totalClassrooms - 1);
                await school.save();
            }

            return {
                ok: true,
                code: 200,
                data: { message: 'Classroom deleted successfully' }
            };
        } catch (error) {
            console.error('Error deleting classroom:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/classroom/getClassroomStudents:
     *   get:
     *     tags:
     *       - Classroom
     *     summary: Get classroom students
     *     description: Get all students enrolled in a specific classroom
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: classroomId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *         description: Classroom ID
     *     responses:
     *       200:
     *         description: Classroom students retrieved successfully
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
     *                   properties:
     *                     classroomId:
     *                       type: string
     *                     totalEnrolled:
     *                       type: number
     *                     capacity:
     *                       type: number
     *                     availableSeats:
     *                       type: number
     *                     students:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Student'
     *       403:
     *         description: Access denied
     *       404:
     *         description: Classroom not found
     */
    async getClassroomStudents({ classroomId, __longToken }) {
        try {
            const classroom = await this.ClassroomModel.findById(classroomId);
            if (!classroom) {
                return { ok: false, code: 404, errors: 'Classroom not found.' };
            }

            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== classroom.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            const students = await this.StudentModel.find({
                classroomId,
                isActive: true,
                enrollmentStatus: 'active'
            }).sort({ rollNumber: 1 });

            return {
                ok: true,
                code: 200,
                data: {
                    classroomId,
                    totalEnrolled: students.length,
                    capacity: classroom.capacity,
                    availableSeats: classroom.capacity - students.length,
                    students
                }
            };
        } catch (error) {
            console.error('Error fetching classroom students:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/classroom/addResourceToClassroom:
     *   post:
     *     tags:
     *       - Classroom
     *     summary: Add resource to classroom
     *     description: Add a resource (e.g., books, equipment) to a classroom
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - classroomId
     *               - name
     *             properties:
     *               classroomId:
     *                 type: string
     *                 description: Classroom ID
     *               name:
     *                 type: string
     *                 description: Resource name
     *               quantity:
     *                 type: number
     *                 default: 1
     *                 description: Quantity of the resource
     *               condition:
     *                 type: string
     *                 enum: [excellent, good, fair, poor]
     *                 default: good
     *                 description: Condition of the resource
     *     responses:
     *       200:
     *         description: Resource added successfully
     *       403:
     *         description: Access denied
     *       404:
     *         description: Classroom not found
     */
    async addResourceToClassroom({ classroomId, name, quantity, condition, __longToken }) {
        try {
            const classroom = await this.ClassroomModel.findById(classroomId);
            if (!classroom) {
                return { ok: false, code: 404, errors: 'Classroom not found.' };
            }

            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== classroom.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            if (!classroom.resources) {
                classroom.resources = [];
            }

            classroom.resources.push({
                name,
                quantity: parseInt(quantity) || 1,
                condition: condition || 'good'
            });

            classroom.updatedAt = new Date();
            await classroom.save();

            // Invalidate cache
            await this.cache.key.delete({ key: `classroom:${classroomId}` });

            return {
                ok: true,
                code: 200,
                data: {
                    classroom: classroom.toObject(),
                    message: 'Resource added successfully'
                }
            };
        } catch (error) {
            console.error('Error adding resource:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/classroom/updateClassroomCapacity:
     *   put:
     *     tags:
     *       - Classroom
     *     summary: Update classroom capacity
     *     description: Update the maximum capacity of a classroom
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - classroomId
     *               - newCapacity
     *             properties:
     *               classroomId:
     *                 type: string
     *                 description: Classroom ID
     *               newCapacity:
     *                 type: number
     *                 minimum: 1
     *                 description: New maximum capacity
     *     responses:
     *       200:
     *         description: Capacity updated successfully
     *       403:
     *         description: Access denied
     *       404:
     *         description: Classroom not found
     *       400:
     *         description: Cannot reduce capacity below current enrollment
     */
    async updateClassroomCapacity({ classroomId, newCapacity, __longToken }) {
        try {
            const classroom = await this.ClassroomModel.findById(classroomId);
            if (!classroom) {
                return { ok: false, code: 404, errors: 'Classroom not found.' };
            }

            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== classroom.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            if (newCapacity < classroom.currentEnrollment) {
                return { 
                    ok: false, 
                    code: 400, 
                    errors: `Cannot reduce capacity below current enrollment (${classroom.currentEnrollment})` 
                };
            }

            classroom.capacity = parseInt(newCapacity) || classroom.capacity;
            classroom.updatedAt = new Date();
            await classroom.save();

            // Invalidate cache
            await this.cache.key.delete({ key: `classroom:${classroomId}` });

            return {
                ok: true,
                code: 200,
                data: {
                    classroom: classroom.toObject(),
                    message: 'Capacity updated successfully'
                }
            };
        } catch (error) {
            console.error('Error updating capacity:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }
};
