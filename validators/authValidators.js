const { body, validationResult } = require('express-validator');

/**
 * Validation rules for authentication endpoints
 */

const registerValidationRules = () => {
    return [
        body('username')
            .trim()
            .notEmpty().withMessage('Username is required')
            .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
            .isAlphanumeric().withMessage('Username must be alphanumeric'),
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Must be a valid email address'),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('confirmPassword')
            .notEmpty().withMessage('Confirm password is required')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords do not match');
                }
                return true;
            })
    ];
};

const loginValidationRules = () => {
    return [
        body('username')
            .trim()
            .notEmpty().withMessage('Username is required'),
        body('password')
            .notEmpty().withMessage('Password is required')
    ];
};

const updateProfileValidationRules = () => {
    return [
        body('username')
            .optional()
            .trim()
            .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
        body('email')
            .optional()
            .trim()
            .isEmail().withMessage('Must be a valid email address')
    ];
};

const changePasswordValidationRules = () => {
    return [
        body('currentPassword')
            .notEmpty().withMessage('Current password is required'),
        body('newPassword')
            .notEmpty().withMessage('New password is required')
            .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
        body('confirmPassword')
            .notEmpty().withMessage('Confirm password is required')
            .custom((value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error('Passwords do not match');
                }
                return true;
            })
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
    registerValidationRules,
    loginValidationRules,
    updateProfileValidationRules,
    changePasswordValidationRules,
    validate
};
