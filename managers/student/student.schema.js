module.exports = {
    enrollStudent: {
        schoolId: { required: true },
        classroomId: { required: true },
        userId: { required: true },
        firstName: { required: true, firstName: true },
        lastName: { required: true, lastName: true },
        dateOfBirth: { required: true, dateOfBirth: true },
        gender: { required: true, gender: true },
        parentName: { required: true },
        parentPhone: { required: true, parentPhone: true },
        parentEmail: { required: true, email: true },
        address: { required: true },
        academicYear: { required: true, academicYear: true },
    },
    updateStudent: {
        firstName: { firstName: true },
        lastName: { lastName: true },
        parentName: {},
        parentPhone: { parentPhone: true },
        parentEmail: { email: true },
        address: {},
    },
};
