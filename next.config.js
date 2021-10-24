const withPlugins = require('next-compose-plugins')
const withLess = require('next-with-less')

module.exports = withPlugins([withLess], {
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
