const withPlugins = require('next-compose-plugins')
const withLess = require('next-with-less')
// next-remove-imports fixes an issue that next.js does not support global CSS imports from node_modules.
// We should try removing this workaround when we upgrade to next.js v12.
const removeImports = require('next-remove-imports')()

/**
 * Remove undefined values so Next.js doesn't complain during serialization
 */
const removeUndefined = obj => {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] === Object(obj[key])) newObj[key] = removeUndefined(obj[key]);
    else if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
}
const next = require('next/dist/lib/is-serializable-props')
// eslint-disable-next-line prefer-destructuring
const isSerializableProps = next.isSerializableProps
next.isSerializableProps = function _isSerializableProps(page, method, input) {
  return isSerializableProps(page, method, removeUndefined(input));
}

const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/projects',
        permanent: false,
      },
      {
        source: '/projects/:projectId',
        destination: '/projects/:projectId/setup',
        permanent: true,
      },
    ]
  },
}

module.exports = withPlugins([withLess, removeImports], config)
