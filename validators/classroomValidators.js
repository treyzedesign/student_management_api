const { body, query, validationResult } = require('express-validator');

/**
 * Validation rules for classroom endpoints
 */

const createClassroomValidationRules = () => {
    return [
        body('schoolId')
            .trim()
            .notEmpty().withMessage('School ID is required')
            .isUUID().withMessage('School ID must be a valid UUID'),
        body('name')
            .trim()
            .notEmpty().withMessage('Classroom name is required')
            .isLength({ min: 2, max: 100 }).withMessage('Classroom name must be between 2 and 100 characters'),
        body('grade')
            .trim()
            .notEmpty().withMessage('Grade is required')
            .isLength({ min: 1, max: 10 }).withMessage('Grade must be between 1 and 10 characters'),
        body('section')
            .trim()
            .notEmpty().withMessage('Section is required')
            .isLength({ min: 1, max: 5 }).withMessage('Section must be between 1 and 5 characters')
            .isAlphanumeric().withMessage('Section must be alphanumeric'),
        body('capacity')
            .trim()
            .notEmpty().withMessage('Capacity is required')
            .isInt({ min: 1, max: 100 }).withMessage('Capacity must be between 1 and 100'),
        body('room')
            .optional()
            .trim()
            .isLength({ max: 50 }).withMessage('Room number must not exceed 50 characters'),
        body('academicYear')
            .trim()
            .notEmpty().withMessage('Academic year is required')
            .matches(/^\d{4}-\d{4}$/).withMessage('Academic year must be in format YYYY-YYYY'),
        body('teacherId')
            .optional()
            .trim()
            .isUUID().withMessage('Teacher ID must be a valid UUID'),
        body('schedule')
            .optional()
            .isObject().withMessage('Schedule must be an object')
    ];
};

const getClassroomByIdValidationRules = () => {
    return [
        query('classroomId')
            .trim()
            .notEmpty().withMessage('Classroom ID is required')
            .isUUID().withMessage('Classroom ID must be a valid UUID')
    ];
};

const getSchoolClassroomsValidationRules = () => {
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
            .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('grade')
            .optional()
            .trim()
            .isLength({ min: 1, max: 10 }).withMessage('Grade must be between 1 and 10 characters')
    ];
};

const updateClassroomValidationRules = () => {
    return [
        body('classroomId')
            .trim()
            .notEmpty().withMessage('Classroom ID is required')
            .isUUID().withMessage('Classroom ID must be a valid UUID'),
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 }).withMessage('Classroom name must be between 2 and 100 characters'),
        body('grade')
            .optional()
            .trim()
            .isLength({ min: 1, max: 10 }).withMessage('Grade must be between 1 and 10 characters'),
        body('section')
            .optional()
            .trim()
            .isLength({ min: 1, max: 5 }).withMessage('Section must be between 1 and 5 characters')
            .isAlphanumeric().withMessage('Section must be alphanumeric'),
        body('capacity')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Capacity must be between 1 and 100'),
        body('room')
            .optional()
            .trim()
            .isLength({ max: 50 }).withMessage('Room number must not exceed 50 characters'),
        body('teacherId')
            .optional()
            .trim()
            .isUUID().withMessage('Teacher ID must be a valid UUID'),
        body('schedule')
            .optional()
            .isObject().withMessage('Schedule must be an object')
    ];
};

const deleteClassroomValidationRules = () => {
    return [
        query('classroomId')
            .trim()
            .notEmpty().withMessage('Classroom ID is required')
            .isUUID().withMessage('Classroom ID must be a valid UUID')
    ];
};

const getClassroomStudentsValidationRules = () => {
    return [
        query('classroomId')
            .trim()
            .notEmpty().withMessage('Classroom ID is required')
            .isUUID().withMessage('Classroom ID must be a valid UUID')
    ];
};

const addResourceToClassroomValidationRules = () => {
    return [
        body('classroomId')
            .trim()
            .notEmpty().withMessage('Classroom ID is required')
            .isUUID().withMessage('Classroom ID must be a valid UUID'),
        body('name')
            .trim()
            .notEmpty().withMessage('Resource name is required')
            .isLength({ min: 2, max: 100 }).withMessage('Resource name must be between 2 and 100 characters'),
        body('quantity')
            .optional()
            .isInt({ min: 1, max: 1000 }).withMessage('Quantity must be between 1 and 1000'),
        body('condition')
            .optional()
            .trim()
            .isIn(['excellent', 'good', 'fair', 'poor']).withMessage('Condition must be excellent, good, fair, or poor')
    ];
};

const updateClassroomCapacityValidationRules = () => {
    return [
        body('classroomId')
            .trim()
            .notEmpty().withMessage('Classroom ID is required')
            .isUUID().withMessage('Classroom ID must be a valid UUID'),
        body('newCapacity')
            .trim()
            .notEmpty().withMessage('New capacity is required')
            .isInt({ min: 1, max: 100 }).withMessage('New capacity must be between 1 and 100')
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
    createClassroomValidationRules,
    getClassroomByIdValidationRules,
    getSchoolClassroomsValidationRules,
    updateClassroomValidationRules,
    deleteClassroomValidationRules,
    getClassroomStudentsValidationRules,
    addResourceToClassroomValidationRules,
    updateClassroomCapacityValidationRules,
    validate
};
