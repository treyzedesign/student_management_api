const emojis = require('../../public/emojis.data.json');

module.exports = {
    id: {
        path: "id",
        type: "string",
        length: { min: 1, max: 50 },
    },
    username: {
        path: 'username',
        type: 'string',
        length: {min: 3, max: 20},
        custom: 'username',
    },
    password: {
        path: 'password',
        type: 'string',
        length: {min: 8, max: 100},
    },
    email: {
        path: 'email',
        type: 'string',
        length: {min:3, max: 100},
    },
    title: {
        path: 'title',
        type: 'string',
        length: {min: 3, max: 300}
    },
    label: {
        path: 'label',
        type: 'string',
        length: {min: 3, max: 100}
    },
    shortDesc: {
        path: 'desc',
        type: 'string',
        length: {min:3, max: 300}
    },
    longDesc: {
        path: 'desc',
        type: 'string',
        length: {min:3, max: 2000}
    },
    url: {
        path: 'url',
        type: 'string',
        length: {min: 9, max: 300},
    },
    emoji: {
        path: 'emoji',
        type: 'Array',
        items: {
            type: 'string',
            length: {min: 1, max: 10},
            oneOf: emojis.value,
        }
    },
    price: {
        path: 'price',
        type: 'number',
    },
    avatar: {
        path: 'avatar',
        type: 'string',
        length: {min: 8, max: 100},
    },
    text: {
        type: 'String',
        length: {min: 3, max:15},
    },
    longText: {
        type: 'String',
        length: {min: 3, max:250},
    },
    paragraph: {
        type: 'String',
        length: {min: 3, max:10000},
    },
    phone: {
        type: 'String',
        length: 13,
    },
    email: {
        type: 'String',
        regex: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    },
    number: {
        type: 'Number',
        length: {min: 1, max:6},
    },
    arrayOfStrings: {
        type: 'Array',
        items: {
            type: 'String',
            length: { min: 3, max: 100}
        }
    },
    obj: {
        type: 'Object',
    },
    bool: {
        type: 'Boolean',
    },
    // School validation fields
    schoolName: {
        path: 'name',
        type: 'string',
        length: {min: 3, max: 100},
    },
    schoolPhone: {
        path: 'phone',
        type: 'string',
        regex: /^\d{10,15}$/,
    },
    zipCode: {
        path: 'zipCode',
        type: 'string',
        length: {min: 5, max: 10},
    },
    academicYear: {
        path: 'academicYear',
        type: 'string',
        length: {min: 4, max: 20},
    },
    // Classroom validation fields
    classroomName: {
        path: 'name',
        type: 'string',
        length: {min: 2, max: 50},
    },
    grade: {
        path: 'grade',
        type: 'string',
        oneOf: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    },
    section: {
        path: 'section',
        type: 'string',
        oneOf: ['A', 'B', 'C', 'D', 'E', 'F'],
    },
    capacity: {
        path: 'capacity',
        type: 'number',
        min: 1,
        max: 100,
    },
    // Student validation fields
    firstName: {
        path: 'firstName',
        type: 'string',
        length: {min: 2, max: 50},
    },
    lastName: {
        path: 'lastName',
        type: 'string',
        length: {min: 2, max: 50},
    },
    dateOfBirth: {
        path: 'dateOfBirth',
        type: 'string',
    },
    gender: {
        path: 'gender',
        type: 'string',
        oneOf: ['male', 'female', 'other'],
    },
    parentPhone: {
        path: 'parentPhone',
        type: 'string',
        regex: /^\d{10,15}$/,
    },
}