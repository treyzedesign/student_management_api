module.exports = {
    createClassroom: {
        schoolId: { required: true },
        name: { required: true, classroomName: true },
        grade: { required: true, grade: true },
        section: { required: true, section: true },
        capacity: { required: true, capacity: true },
        room: { required: true },
        academicYear: { required: true, academicYear: true },
    },
    updateClassroom: {
        name: { classroomName: true },
        grade: { grade: true },
        section: { section: true },
        capacity: { capacity: true },
        room: {},
        teacherId: {},
        schedule: {},
    },
};
