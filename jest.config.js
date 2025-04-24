/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // Necessary for ES Modules support in Jest
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\.{1,2}/.*)\.js$': '$1',
    },
    transform: {
        // '^.+\\.jsx?$' to process js/jsx with `ts-jest`
        // '^.+\\.tsx?$' to process ts/tsx with `ts-jest`
        '^.+\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
}; 