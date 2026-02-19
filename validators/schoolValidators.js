const { body, query, validationResult } = require('express-validator');

/**
 * Validation rules for school endpoints
 */

const createSchoolValidationRules = () => {
    return [
        body('name')
            .trim()
            .notEmpty().withMessage('School name is required')
            .isLength({ min: 3, max: 100 }).withMessage('School name must be between 3 and 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
        body('address')
            .trim()
            .notEmpty().withMessage('Address is required')
            .isLength({ min: 10, max: 500 }).withMessage('Address must be between 10 and 500 characters'),
        body('city')
            .trim()
            .notEmpty().withMessage('City is required')
            .isLength({ min: 2, max: 50 }).withMessage('City must be between 2 and 50 characters')
            .isAlpha().withMessage('City must contain only letters'),
        body('state')
            .trim()
            .notEmpty().withMessage('State is required')
            .isLength({ min: 2, max: 50 }).withMessage('State must be between 2 and 50 characters'),
        body('zipCode')
            .trim()
            .notEmpty().withMessage('Zip code is required')
            .isPostalCode().withMessage('Must be a valid zip code'),
        body('phone')
            .trim()
            .notEmpty().withMessage('Phone number is required')
            .isMobilePhone().withMessage('Must be a valid phone number'),
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Must be a valid email address'),
        body('adminId')
            .trim()
            .notEmpty().withMessage('Admin ID is required')
            .isUUID().withMessage('Admin ID must be a valid UUID'),
        body('academicYear')
            .trim()
            .notEmpty().withMessage('Academic year is required')
            .matches(/^\d{4}-\d{4}$/).withMessage('Academic year must be in format YYYY-YYYY')
    ];
};

const getSchoolByIdValidationRules = () => {
    return [
        query('schoolId')
            .trim()
            .notEmpty().withMessage('School ID is required')
            .isUUID().withMessage('School ID must be a valid UUID')
    ];
};

const getAllSchoolsValidationRules = () => {
    return [
        query('page')
            .optional()
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    ];
};

const updateSchoolValidationRules = () => {
    return [
        body('schoolId')
            .trim()
            .notEmpty().withMessage('School ID is required')
            .isUUID().withMessage('School ID must be a valid UUID'),
        body('name')
            .optional()
            .trim()
            .isLength({ min: 3, max: 100 }).withMessage('School name must be between 3 and 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
        body('address')
            .optional()
            .trim()
            .isLength({ min: 10, max: 500 }).withMessage('Address must be between 10 and 500 characters'),
        body('city')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 }).withMessage('City must be between 2 and 50 characters')
            .isAlpha().withMessage('City must contain only letters'),
        body('state')
            .optional()
            .trim()
            .isLength({ min: 2, max: 50 }).withMessage('State must be between 2 and 50 characters'),
        body('zipCode')
            .optional()
            .trim()
            .isPostalCode().withMessage('Must be a valid zip code'),
        body('phone')
            .optional()
            .trim()
            .isMobilePhone().withMessage('Must be a valid phone number'),
        body('email')
            .optional()
            .trim()
            .isEmail().withMessage('Must be a valid email address'),
        body('academicYear')
            .optional()
            .trim()
            .matches(/^\d{4}-\d{4}$/).withMessage('Academic year must be in format YYYY-YYYY')
    ];
};

const deleteSchoolValidationRules = () => {
    return [
        query('schoolId')
            .trim()
            .notEmpty().withMessage('School ID is required')
            .isUUID().withMessage('School ID must be a valid UUID')
    ];
};

const getSchoolAdminsValidationRules = () => {
    return [
        query('schoolId')
            .trim()
            .notEmpty().withMessage('School ID is required')
            .isUUID().withMessage('School ID must be a valid UUID')
    ];
};

const getSchoolStudentsValidationRules = () => {
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

const getSchoolClassroomsValidationRules = () => {
    return [
        query('schoolId')
            .trim()
            .notEmpty().withMessage('School ID is required')
            .isUUID().withMessage('School ID must be a valid UUID')
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
    createSchoolValidationRules,
    getSchoolByIdValidationRules,
    getAllSchoolsValidationRules,
    updateSchoolValidationRules,
    deleteSchoolValidationRules,
    getSchoolAdminsValidationRules,
    getSchoolStudentsValidationRules,
    getSchoolClassroomsValidationRules,
    validate
};
