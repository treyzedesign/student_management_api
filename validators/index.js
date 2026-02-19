/**
 * Central validator exports
 * Consolidates all validation rules and middleware
 */

const authValidators = require('./authValidators');
const studentValidators = require('./studentValidators');
const classroomValidators = require('./classroomValidators');
const schoolValidators = require('./schoolValidators');

module.exports = {
    // Auth validators
    ...authValidators,
    
    // Student validators
    ...studentValidators,
    
    // Classroom validators
    ...classroomValidators,
    
    // School validators
    ...schoolValidators,
    
    // Export all validation rules by category
    auth: {
        registerValidationRules: authValidators.registerValidationRules,
        loginValidationRules: authValidators.loginValidationRules,
        updateProfileValidationRules: authValidators.updateProfileValidationRules,
        changePasswordValidationRules: authValidators.changePasswordValidationRules,
        validate: authValidators.validate
    },
    
    student: {
        enrollStudentValidationRules: studentValidators.enrollStudentValidationRules,
        getStudentByIdValidationRules: studentValidators.getStudentByIdValidationRules,
        getStudentsBySchoolValidationRules: studentValidators.getStudentsBySchoolValidationRules,
        getStudentsByClassroomValidationRules: studentValidators.getStudentsByClassroomValidationRules,
        updateStudentValidationRules: studentValidators.updateStudentValidationRules,
        transferStudentValidationRules: studentValidators.transferStudentValidationRules,
        updateAttendanceValidationRules: studentValidators.updateAttendanceValidationRules,
        addMarksValidationRules: studentValidators.addMarksValidationRules,
        getStudentMarksValidationRules: studentValidators.getStudentMarksValidationRules,
        deactivateStudentValidationRules: studentValidators.deactivateStudentValidationRules,
        validate: studentValidators.validate
    },
    
    classroom: {
        createClassroomValidationRules: classroomValidators.createClassroomValidationRules,
        getClassroomByIdValidationRules: classroomValidators.getClassroomByIdValidationRules,
        getSchoolClassroomsValidationRules: classroomValidators.getSchoolClassroomsValidationRules,
        updateClassroomValidationRules: classroomValidators.updateClassroomValidationRules,
        deleteClassroomValidationRules: classroomValidators.deleteClassroomValidationRules,
        getClassroomStudentsValidationRules: classroomValidators.getClassroomStudentsValidationRules,
        addResourceToClassroomValidationRules: classroomValidators.addResourceToClassroomValidationRules,
        updateClassroomCapacityValidationRules: classroomValidators.updateClassroomCapacityValidationRules,
        validate: classroomValidators.validate
    },
    
    school: {
        createSchoolValidationRules: schoolValidators.createSchoolValidationRules,
        getSchoolByIdValidationRules: schoolValidators.getSchoolByIdValidationRules,
        getAllSchoolsValidationRules: schoolValidators.getAllSchoolsValidationRules,
        updateSchoolValidationRules: schoolValidators.updateSchoolValidationRules,
        deleteSchoolValidationRules: schoolValidators.deleteSchoolValidationRules,
        getSchoolAdminsValidationRules: schoolValidators.getSchoolAdminsValidationRules,
        getSchoolStudentsValidationRules: schoolValidators.getSchoolStudentsValidationRules,
        getSchoolClassroomsValidationRules: schoolValidators.getSchoolClassroomsValidationRules,
        validate: schoolValidators.validate
    }
};
