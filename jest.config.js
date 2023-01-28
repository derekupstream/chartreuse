/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    // neat-csv is an esm module, so we want it to be trasnformed
    'node_modules/(?!neat-csv/.*)',
  ],
  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ['node_modules', '<rootDir>'],
  // The glob patterns Jest uses to detect test files
  testMatch: ['**/*.test.ts'],

}
