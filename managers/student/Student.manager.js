const { nanoid } = require('nanoid');
const studentValidators = require('../../validators/studentValidators');

module.exports = class StudentManager {
    constructor({ utils, cache, config, cortex, managers, validators } = {}) {
        this.config = config;
        this.cortex = cortex;
        this.validators = validators;
        this.managers = managers;
        this.cache = cache;
        this.utils = utils;

        // Import models
        this.StudentModel = require('../../models/Student.model');
        this.ClassroomModel = require('../../models/Classroom.model');
        this.SchoolModel = require('../../models/School.model');
        this.UserModel = require('../../models/User.model');

        // Expose public methods with HTTP methods
        this.httpExposed = [
            'post=enrollStudent',
            'get=getStudentById',
            'get=getStudentsBySchool',
            'get=getStudentsByClassroom',
            'put=updateStudent',
            'put=transferStudent',
            'put=updateAttendance',
            'post=addMarks',
            'get=getStudentMarks',
            'delete=deactivateStudent'
        ];
    }

    /**
     * Helper method to validate input using express-validator rules
     */
    validateInput(data, rules) {
        const errors = [];
        
        for (const rule of rules) {
            // Extract field name from rule
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
                
                // Date validation
                if (rule.builder.isISO8601 && fieldValue) {
                    const date = new Date(fieldValue);
                    if (isNaN(date.getTime())) {
                        errors.push({ field: fieldName, message: `${fieldName} must be a valid date` });
                    }
                }
                
                // In validation
                if (rule.builder.isIn && fieldValue) {
                    if (!rule.builder.isIn.options.includes(fieldValue)) {
                        errors.push({ field: fieldName, message: `${fieldName} must be one of: ${rule.builder.isIn.options.join(', ')}` });
                    }
                }
                
                // Mobile phone validation
                if (rule.builder.isMobilePhone && fieldValue) {
                    const phoneRegex = /^[+]?[1-9]\d{1,14}$/;
                    if (!phoneRegex.test(fieldValue.replace(/[^\d]/g, ''))) {
                        errors.push({ field: fieldName, message: `${fieldName} must be a valid phone number` });
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
     * /api/student/enrollStudent:
     *   post:
     *     tags:
     *       - Student
     *     summary: Enroll a student in a classroom
     *     description: Assign an existing student user to a school and classroom (School Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *               - schoolId
     *               - classroomId
     *               - firstName
     *               - lastName
     *               - dateOfBirth
     *               - gender
     *               - parentName
     *               - parentPhone
     *               - academicYear
     *             properties:
     *               userId:
     *                 type: string
     *                 description: User ID of the student (from registerStudentUser)
     *               schoolId:
     *                 type: string
     *                 description: School ID where student will be enrolled
     *               classroomId:
     *                 type: string
     *                 description: Classroom ID where student will be assigned
     *               firstName:
     *                 type: string
     *                 description: Student's first name
     *               lastName:
     *                 type: string
     *                 description: Student's last name
     *               dateOfBirth:
     *                 type: string
     *                 format: date
     *                 description: Student's date of birth
     *               gender:
     *                 type: string
     *                 enum: [male, female, other]
     *                 description: Student's gender
     *               parentName:
     *                 type: string
     *                 description: Parent/guardian full name
     *               parentPhone:
     *                 type: string
     *                 description: Parent/guardian phone number
     *               parentEmail:
     *                 type: string
     *                 format: email
     *                 description: Parent/guardian email address
     *               address:
     *                 type: string
     *                 description: Student's home address
     *               academicYear:
     *                 type: string
     *                 description: Academic year of enrollment
     *     responses:
     *       201:
     *         description: Student enrolled successfully
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
     *                     student:
     *                       $ref: '#/components/schemas/Student'
     *                     message:
     *                       type: string
     *       403:
     *         description: Access denied - only school admins can enroll students
     *       400:
     *         description: Validation error or classroom at full capacity
     *       404:
     *         description: School, classroom, or user not found
     */
    async enrollStudent({
        userId, schoolId, classroomId, firstName, lastName, dateOfBirth, gender,
        parentName, parentPhone, parentEmail, address, academicYear, __longToken
    }) {
        // Validation using studentValidators
        const validationRules = studentValidators.enrollStudentValidationRules();
        const validationError = this.validateInput({ userId, schoolId, classroomId, firstName, lastName, dateOfBirth, gender, parentName, parentPhone, parentEmail, address, academicYear }, validationRules);
        if (validationError) return validationError;

        // Authorization check
        if (__longToken.role !== 'school_admin' || __longToken.schoolId !== schoolId) {
            return { ok: false, code: 403, errors: 'Access denied. Only school admins can enroll students.' };
        }

        try {
            // Verify user exists
            const user = await this.UserModel.findById(userId);
            if (!user) {
                return { ok: false, code: 404, errors: 'User not found. Create a student user account first using registerStudentUser.' };
            }
            if (user.role !== 'student') {
                return { ok: false, code: 404, errors: 'User is not a student. Create a student user account first using registerStudentUser.' };
            }
            // Verify school and classroom exist
            const school = await this.SchoolModel.findById(schoolId);
            if (!school) {
                return { ok: false, code: 404, errors: 'School not found.' };
            }

            const classroom = await this.ClassroomModel.findById(classroomId);
            if (!classroom || classroom.schoolId !== schoolId) {
                return { ok: false, code: 404, errors: 'Classroom not found or does not belong to this school.' };
            }

            // Check classroom capacity
            if (classroom.currentEnrollment >= classroom.capacity) {
                return { 
                    ok: false, 
                    code: 400, 
                    errors: 'Classroom is at full capacity. Cannot enroll more students.' 
                };
            }

            // Update user with school assignment
            user.schoolId = schoolId;
            await user.save();

            // Get next roll number for the classroom
            const highestRoll = await this.StudentModel.findOne({
                classroomId
            }).sort({ rollNumber: -1 });

            const nextRollNumber = highestRoll ? 
                (parseInt(highestRoll.rollNumber) + 1).toString() : '1';

            // Generate admission number
            const admissionNumber = `${schoolId.substring(0, 4)}-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;

            // Create student linked to user
            const student = new this.StudentModel({
                _id: userId,  // Use the same ID as the user for easy reference 
                userId: userId,  // student profile ID
                firstName,
                lastName,
                schoolId,
                classroomId,
                rollNumber: nextRollNumber,
                dateOfBirth: new Date(dateOfBirth),
                gender,
                parentName,
                parentPhone,
                parentEmail,
                address,
                admissionNumber,
                academicYear,
                enrollmentStatus: 'active',
                admissionDate: new Date()
            });

            await student.save();

            // Update classroom enrollment
            classroom.currentEnrollment += 1;
            await classroom.save();

            // Update school's student count
            school.totalStudents += 1;
            await school.save();

            // Cache the student
            await this.cache.key.set({
                key: `student:${userId}`,
                data: JSON.stringify(student.toObject()),
                ttl: 3600
            });

            return {
                ok: true,
                code: 201,
                data: {
                    student: student.toObject(),
                    message: 'Student enrolled successfully'
                }
            };
        } catch (error) {
            console.error('Error enrolling student:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/student/getStudentById:
     *   get:
     *     tags:
     *       - Student
     *     summary: Get student by ID
     *     description: Retrieve a student's information by their ID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: studentId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *         description: Student ID
     *     responses:
     *       200:
     *         description: Student retrieved successfully
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
     *                   $ref: '#/components/schemas/Student'
     *       403:
     *         description: Access denied
     *       404:
     *         description: Student not found
     */
    async getStudentById({ studentId, __longToken }) {
        try {
            // Check cache first
            const cachedStudent = await this.cache.key.get({ key: `student:${studentId}` });
            if (cachedStudent) {
                const student = JSON.parse(cachedStudent);
                // Verify authorization
                if (__longToken.role === 'school_admin' && __longToken.schoolId !== student.schoolId) {
                    return { ok: false, code: 403, errors: 'Access denied.' };
                }
                return { ok: true, code: 200, data: student };
            }

            const student = await this.StudentModel.findById(studentId);
            if (!student) {
                return { ok: false, code: 404, errors: 'Student not found.' };
            }

            // Verify authorization
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== student.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            // Cache the student
            await this.cache.key.set({
                key: `student:${studentId}`,
                data: JSON.stringify(student.toObject()),
                ttl: 3600
            });

            return {
                ok: true,
                code: 200,
                data: student.toObject()
            };
        } catch (error) {
            console.error('Error fetching student:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/student/getStudentsBySchool:
     *   get:
     *     tags:
     *       - Student
     *     summary: Get students by school
     *     description: Get all students for a specific school with pagination
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
     *           default: 20
     *         description: Number of students per page
     *     responses:
     *       200:
     *         description: Students retrieved successfully
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
     *                     students:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Student'
     *                     pagination:
     *                       $ref: '#/components/schemas/Pagination'
     *       403:
     *         description: Access denied
     */
    async getStudentsBySchool({ schoolId, page = 1, limit = 20, __longToken }) {
        try {
            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            const skip = (page - 1) * limit;

            const students = await this.StudentModel.find({
                schoolId,
                isActive: true,
                enrollmentStatus: { $in: ['active', 'transferred'] }
            })
                .limit(limit)
                .skip(skip)
                .sort({ createdAt: -1 });

            const total = await this.StudentModel.countDocuments({
                schoolId,
                isActive: true,
                enrollmentStatus: { $in: ['active', 'transferred'] }
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
     * /api/student/getStudentsByClassroom:
     *   get:
     *     tags:
     *       - Student
     *     summary: Get students by classroom
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
     *                     classroomName:
     *                       type: string
     *                     totalEnrolled:
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
    async getStudentsByClassroom({ classroomId, __longToken }) {
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
            }).sort({ rollNumber: 1 }).populate('userId', 'email');

            return {
                ok: true,
                code: 200,
                data: {
                    classroomId,
                    classroomName: classroom.name,
                    totalEnrolled: students.length,
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
     * /api/student/updateStudent:
     *   put:
     *     tags:
     *       - Student
     *     summary: Update student information
     *     description: Update a student's personal and contact information
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: studentId
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
     *               firstName:
     *                 type: string
     *                 description: Student's first name
     *               lastName:
     *                 type: string
     *                 description: Student's last name
     *               parentName:
     *                 type: string
     *                 description: Parent/guardian full name
     *               parentPhone:
     *                 type: string
     *                 description: Parent/guardian phone number
     *               parentEmail:
     *                 type: string
     *                 format: email
     *                 description: Parent/guardian email address
     *               address:
     *                 type: string
     *                 description: Student's home address
     *     responses:
     *       200:
     *         description: Student updated successfully
     *       403:
     *         description: Access denied
     *       404:
     *         description: Student not found
     */
    async updateStudent({
        studentId, firstName, lastName, parentName, parentPhone, parentEmail, address, __longToken
    }) {
        try {
            const student = await this.StudentModel.findById(studentId);
            if (!student) {
                return { ok: false, code: 404, errors: 'Student not found.' };
            }

            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== student.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            // Update fields
            if (firstName) student.firstName = firstName;
            if (lastName) student.lastName = lastName;
            if (parentName) student.parentName = parentName;
            if (parentPhone) student.parentPhone = parentPhone;
            if (parentEmail) student.parentEmail = parentEmail;
            if (address) student.address = address;

            student.updatedAt = new Date();
            await student.save();

            // Invalidate cache
            await this.cache.key.delete({ key: `student:${studentId}` });

            return {
                ok: true,
                code: 200,
                data: {
                    student: student.toObject(),
                    message: 'Student updated successfully'
                }
            };
        } catch (error) {
            console.error('Error updating student:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/student/transferStudent:
     *   post:
     *     tags:
     *       - Student
     *     summary: Transfer student to another classroom
     *     description: Transfer a student from their current classroom to another classroom within the same school
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - studentId
     *               - newClassroomId
     *             properties:
     *               studentId:
     *                 type: string
     *                 description: Student ID to transfer
     *               newClassroomId:
     *                 type: string
     *                 description: Target classroom ID
     *               reason:
     *                 type: string
     *                 description: Reason for transfer
     *     responses:
     *       200:
     *         description: Student transferred successfully
     *       403:
     *         description: Access denied
     *       404:
     *         description: Student or classroom not found
     *       400:
     *         description: New classroom at full capacity
     */
    async transferStudent({ studentId, newClassroomId, reason, __longToken }) {
        try {
            const student = await this.StudentModel.findById(studentId);
            if (!student) {
                return { ok: false, code: 404, errors: 'Student not found.' };
            }

            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== student.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            const oldClassroom = await this.ClassroomModel.findById(student.classroomId);
            const newClassroom = await this.ClassroomModel.findById(newClassroomId);

            if (!newClassroom || newClassroom.schoolId !== student.schoolId) {
                return { ok: false, code: 404, errors: 'New classroom not found or does not belong to this school.' };
            }

            // Check new classroom capacity
            if (newClassroom.currentEnrollment >= newClassroom.capacity) {
                return { 
                    ok: false, 
                    code: 400, 
                    errors: 'New classroom is at full capacity.' 
                };
            }

            // Record transfer history
            student.transferHistory.push({
                fromClassroom: student.classroomId,
                toClassroom: newClassroomId,
                transferDate: new Date(),
                reason: reason || 'Not specified'
            });

            // Update student's classroom
            student.classroomId = newClassroomId;
            student.enrollmentStatus = 'transferred';
            student.updatedAt = new Date();

            await student.save();

            // Update classroom enrollments
            if (oldClassroom) {
                oldClassroom.currentEnrollment = Math.max(0, oldClassroom.currentEnrollment - 1);
                await oldClassroom.save();
                await this.cache.key.delete({ key: `classroom:${oldClassroom._id}` });
            }

            newClassroom.currentEnrollment += 1;
            await newClassroom.save();
            await this.cache.key.delete({ key: `classroom:${newClassroomId}` });

            // Invalidate student cache
            await this.cache.key.delete({ key: `student:${studentId}` });

            return {
                ok: true,
                code: 200,
                data: {
                    student: student.toObject(),
                    message: 'Student transferred successfully'
                }
            };
        } catch (error) {
            console.error('Error transferring student:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/student/updateAttendance:
     *   post:
     *     tags:
     *       - Student
     *     summary: Update student attendance
     *     description: Update a student's attendance record for today
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - studentId
     *               - status
     *             properties:
     *               studentId:
     *                 type: string
     *                 description: Student ID
     *               status:
     *                 type: string
     *                 enum: [present, absent, leave]
     *                 description: Attendance status for today
     *     responses:
     *       200:
     *         description: Attendance updated successfully
     *       403:
     *         description: Access denied
     *       404:
     *         description: Student not found
     *       400:
     *         description: Invalid attendance status
     */
    async updateAttendance({ studentId, status, __longToken }) {
        try {
            if (!['present', 'absent', 'leave'].includes(status)) {
                return { ok: false, code: 400, errors: 'Invalid attendance status.' };
            }

            const student = await this.StudentModel.findById(studentId);
            if (!student) {
                return { ok: false, code: 404, errors: 'Student not found.' };
            }

            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== student.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            student.attendance[status] = (student.attendance[status] || 0) + 1;
            student.updatedAt = new Date();

            await student.save();

            // Invalidate cache
            await this.cache.key.delete({ key: `student:${studentId}` });

            return {
                ok: true,
                code: 200,
                data: {
                    student: student.toObject(),
                    message: 'Attendance updated successfully'
                }
            };
        } catch (error) {
            console.error('Error updating attendance:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/student/addMarks:
     *   post:
     *     tags:
     *       - Student
     *     summary: Add marks for student
     *     description: Add subject marks for a student
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - studentId
     *               - subject
     *               - score
     *             properties:
     *               studentId:
     *                 type: string
     *                 description: Student ID
     *               subject:
     *                 type: string
     *                 description: Subject name
     *               score:
     *                 type: number
     *                 minimum: 0
     *                 maximum: 100
     *                 description: Score obtained (0-100)
     *     responses:
     *       200:
     *         description: Marks added successfully
     *       403:
     *         description: Access denied
     *       404:
     *         description: Student not found
     *       400:
     *         description: Invalid score (must be 0-100)
     */
    async addMarks({ studentId, subject, score, __longToken }) {
        try {
            if (score < 0 || score > 100) {
                return { ok: false, code: 400, errors: 'Score must be between 0 and 100.' };
            }

            const student = await this.StudentModel.findById(studentId);
            if (!student) {
                return { ok: false, code: 404, errors: 'Student not found.' };
            }

            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== student.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            if (!student.marks) {
                student.marks = [];
            }

            student.marks.push({
                subject,
                score: parseInt(score),
                date: new Date()
            });

            student.updatedAt = new Date();
            await student.save();

            // Invalidate cache
            await this.cache.key.delete({ key: `student:${studentId}` });

            return {
                ok: true,
                code: 200,
                data: {
                    student: student.toObject(),
                    message: 'Marks added successfully'
                }
            };
        } catch (error) {
            console.error('Error adding marks:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/student/getStudentMarks:
     *   get:
     *     tags:
     *       - Student
     *     summary: Get student marks
     *     description: Retrieve all marks for a specific student
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: studentId
     *         in: query
     *         required: true
     *         schema:
     *           type: string
     *         description: Student ID
     *     responses:
     *       200:
     *         description: Student marks retrieved successfully
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
     *                     studentId:
     *                       type: string
     *                     marks:
     *                       type: array
     *                       items:
     *                         type: object
     *                         properties:
     *                           subject:
     *                             type: string
     *                           score:
     *                             type: number
     *                           date:
     *                             type: string
     *                             format: date
     *       403:
     *         description: Access denied
     *       404:
     *         description: Student not found
     */
    async getStudentMarks({ studentId, __longToken }) {
        try {
            const student = await this.StudentModel.findById(studentId);
            if (!student) {
                return { ok: false, code: 404, errors: 'Student not found.' };
            }

            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== student.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            return {
                ok: true,
                code: 200,
                data: {
                    studentId,
                    marks: student.marks || []
                }
            };
        } catch (error) {
            console.error('Error fetching marks:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }

    /**
     * @swagger
     * /api/student/deactivateStudent:
     *   post:
     *     tags:
     *       - Student
     *     summary: Deactivate student
     *     description: Deactivate a student account (soft delete). Can be due to graduation or dropping out.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - studentId
     *             properties:
     *               studentId:
     *                 type: string
     *                 description: Student ID to deactivate
     *               reason:
     *                 type: string
     *                 enum: [graduated, dropped]
     *                 description: Reason for deactivation
     *     responses:
     *       200:
     *         description: Student deactivated successfully
     *       403:
     *         description: Access denied
     *       404:
     *         description: Student not found
     */
    async deactivateStudent({ studentId, reason, __longToken }) {
        try {
            const student = await this.StudentModel.findById(studentId);
            if (!student) {
                return { ok: false, code: 404, errors: 'Student not found.' };
            }

            // Authorization check
            if (__longToken.role === 'school_admin' && __longToken.schoolId !== student.schoolId) {
                return { ok: false, code: 403, errors: 'Access denied.' };
            }

            student.isActive = false;
            student.enrollmentStatus = reason === 'graduated' ? 'graduated' : 'dropped';
            student.updatedAt = new Date();

            await student.save();

            // Update classroom enrollment if student was active
            if (student.enrollmentStatus === 'active') {
                const classroom = await this.ClassroomModel.findById(student.classroomId);
                if (classroom) {
                    classroom.currentEnrollment = Math.max(0, classroom.currentEnrollment - 1);
                    await classroom.save();
                    await this.cache.key.delete({ key: `classroom:${student.classroomId}` });
                }
            }

            // Invalidate cache
            await this.cache.key.delete({ key: `student:${studentId}` });

            return {
                ok: true,
                code: 200,
                data: { message: 'Student deactivated successfully' }
            };
        } catch (error) {
            console.error('Error deactivating student:', error);
            return { ok: false, code: 500, errors: error.message };
        }
    }
};
