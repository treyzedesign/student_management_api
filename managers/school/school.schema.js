module.exports = {
    createSchool: {
        name: { required: true, schoolName: true },
        address: { required: true },
        city: { required: true },
        state: { required: true },
        zipCode: { required: true, zipCode: true },
        phone: { required: true, schoolPhone: true },
        email: { required: true, email: true },
        adminId: { required: true },
        academicYear: { required: true, academicYear: true },
    },
    updateSchool: {
        name: { schoolName: true },
        address: {},
        city: {},
        state: {},
        zipCode: { zipCode: true },
        phone: { schoolPhone: true },
        email: { email: true },
        academicYear: { academicYear: true },
    },
};
