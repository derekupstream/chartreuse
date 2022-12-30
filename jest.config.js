/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  transformIgnorePatterns: [
    // neat-csv is an esm module, so we want it to be trasnformed
    'node_modules/(?!neat-csv/.*)',
  ],
}
