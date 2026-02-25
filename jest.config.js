module.exports = {
    preset: 'jest-expo',
    transform: {
        '^.+\\.(js|ts|tsx)$': 'babel-jest',
    },
    testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
