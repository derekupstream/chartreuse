const withPlugins = require('next-compose-plugins')
const withLess = require('next-with-less')
// next-remove-imports fixes an issue that next.js does not support global CSS imports from node_modules.
// We should try removing this workaround when we upgrade to next.js v12.
const removeImports = require('next-remove-imports')()

module.exports = withPlugins([withLess, removeImports], {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/projects/:projectId',
        destination: '/projects/:projectId/setup',
        permanent: true,
      },
    ]
  },
})
