const { body, query, validationResult } = require('express-validator');

/**
 * Validation rules for student endpoints
 */

const enrollStudentValidationRules = () => {
    return [
        body('schoolId')
            .trim()
            .notEmpty().withMessage('School ID is required')
            .isUUID().withMessage('School ID must be a valid UUID'),
        body('classroomId')
            .trim()
            .notEmpty().withMessage('Classroom ID is required')
            .isUUID().withMessage('Classroom ID must be a valid UUID'),
        body('firstName')
            .trim()
            .notEmpty().withMessage('First name is required')
            .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
            .isAlpha().withMessage('First name must contain only letters'),
        body('lastName')
            .trim()
            .notEmpty().withMessage('Last name is required')
            .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
            .isAlpha().withMessage('Last name must contain only letters'),
        body('dateOfBirth')
            .trim()
            .notEmpty().withMessage('Date of birth is required')
            .isISO8601().withMessage('Date of birth must be a valid date')
            .custom((value) => {
                const dob = new Date(value);
                const today = new Date();
                const age = today.getFullYear() - dob.getFullYear();
                if (age < 5 || age > 25) {
                    throw new Error('Student age must be between 5 and 25 years');
                }
                return true;
            }),
        body('gender')
            .trim()
            .notEmpty().withMessage('Gender is required')
            .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
        body('parentName')
            .trim()
            .notEmpty().withMessage('Parent name is required')
            .isLength({ min: 3, max: 100 }).withMessage('Parent name must be between 3 and 100 characters'),
        body('parentPhone')
            .trim()
            .notEmpty().withMessage('Parent phone is required')
            .isMobilePhone().withMessage('Must be a valid phone number'),
        body('parentEmail')
            .trim()
            .optional()
            .isEmail().withMessage('Must be a valid email address'),
        body('address')
            .trim()
            .optional()
            .isLength({ max: 500 }).withMessage('Address must not exceed 500 characters'),
        body('academicYear')
            .trim()
            .notEmpty().withMessage('Academic year is required')
            .matches(/^\d{4}-\d{4}$/).withMessage('Academic year must be in format YYYY-YYYY')
    ];
};

const getStudentByIdValidationRules = () => {
    return [
        query('studentId')
            .trim()
            .notEmpty().withMessage('Student ID is required')
            .isUUID().withMessage('Student ID must be a valid UUID')
    ];
};

const getStudentsBySchoolValidationRules = () => {
    return [
        query('schoolId')
            .trim()
            .notEmpty().withMessage('School ID is required')
            .isUUID().withMessage('School ID must be a valid UUID'),
        query('page')
            .optional()
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ];
};

const getStudentsByClassroomValidationRules = () => {
    return [
        query('classroomId')
            .trim()
            .notEmpty().withMessage('Classroom ID is required')
            .isUUID().withMessage('Classroom ID must be a valid UUID')
    ];
};

const updateStudentValidationRules = () => {
    return [
        body('studentId')
            .trim()
            .notEmpty().withMessage('Student ID is required')
            .isUUID().withMessage('Student ID must be a valid UUID'),
        body('firstName')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
            .isAlpha().withMessage('First name must contain only letters'),
        body('lastName')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
            .isAlpha().withMessage('Last name must contain only letters'),
        body('parentName')
            .optional()
            .trim()
            .isLength({ min: 3, max: 100 }).withMessage('Parent name must be between 3 and 100 characters'),
        body('parentPhone')
            .optional()
            .trim()
            .isMobilePhone().withMessage('Must be a valid phone number'),
        body('parentEmail')
            .optional()
            .trim()
            .isEmail().withMessage('Must be a valid email address'),
        body('address')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Address must not exceed 500 characters')
    ];
};

const transferStudentValidationRules = () => {
    return [
        body('studentId')
            .trim()
            .notEmpty().withMessage('Student ID is required')
            .isUUID().withMessage('Student ID must be a valid UUID'),
        body('newClassroomId')
            .trim()
            .notEmpty().withMessage('New classroom ID is required')
            .isUUID().withMessage('New classroom ID must be a valid UUID'),
        body('reason')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
    ];
};

const updateAttendanceValidationRules = () => {
    return [
        body('studentId')
            .trim()
            .notEmpty().withMessage('Student ID is required')
            .isUUID().withMessage('Student ID must be a valid UUID'),
        body('status')
            .trim()
            .notEmpty().withMessage('Attendance status is required')
            .isIn(['present', 'absent', 'leave']).withMessage('Status must be present, absent, or leave')
    ];
};

const addMarksValidationRules = () => {
    return [
        body('studentId')
            .trim()
            .notEmpty().withMessage('Student ID is required')
            .isUUID().withMessage('Student ID must be a valid UUID'),
        body('subject')
            .trim()
            .notEmpty().withMessage('Subject is required')
            .isLength({ min: 2, max: 50 }).withMessage('Subject must be between 2 and 50 characters'),
        body('score')
            .trim()
            .notEmpty().withMessage('Score is required')
            .isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100')
    ];
};

const getStudentMarksValidationRules = () => {
    return [
        query('studentId')
            .trim()
            .notEmpty().withMessage('Student ID is required')
            .isUUID().withMessage('Student ID must be a valid UUID')
    ];
};

const deactivateStudentValidationRules = () => {
    return [
        body('studentId')
            .trim()
            .notEmpty().withMessage('Student ID is required')
            .isUUID().withMessage('Student ID must be a valid UUID'),
        body('reason')
            .optional()
            .trim()
            .isIn(['graduated', 'dropped']).withMessage('Reason must be graduated or dropped')
    ];
};

/**
 * Middleware to handle validation errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            ok: false,
            code: 400,
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            })),
            message: 'Validation failed'
        });
    }
    next();
};

module.exports = {
    enrollStudentValidationRules,
    getStudentByIdValidationRules,
    getStudentsBySchoolValidationRules,
    getStudentsByClassroomValidationRules,
    updateStudentValidationRules,
    transferStudentValidationRules,
    updateAttendanceValidationRules,
    addMarksValidationRules,
    getStudentMarksValidationRules,
    deactivateStudentValidationRules,
    validate
};
