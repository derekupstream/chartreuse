const withLess = require('next-with-less');

const config = {
  compiler: {
    styledComponents: true
  },
  reactStrictMode: true,
  transpilePackages: [ "antd", "@ant-design", "rc-util", "rc-pagination", "rc-picker", "rc-notification", "rc-tooltip", "rc-tree", "rc-table" ],
  webpack(_config) {
    _config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });
    return _config;
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/projects',
        permanent: false
      },
      // cant get this to work, to exclude /projects/new
      // {
      //   // redirect to the first project setup page
      //   source: '/projects/:projectId((?!new).+)',
      //   destination: '/projects/:projectId/single-use-items',
      //   permanent: false
      // },
      {
        source: '/templates',
        destination: '/projects?view=templates',
        permanent: true
      },
      {
        // redirect to the first setup page
        source: '/setup',
        destination: '/setup/trial',
        permanent: false
      },
      {
        // temporary redirect to be backwards-compatible with firebase
        source: '/org-setup',
        destination: '/setup/trial',
        permanent: false
      },
      {
        // redirect to the first setup page
        source: '/shared/:slug',
        destination: '/share/:slug',
        permanent: true
      },
    ];
  }
};

module.exports = withLess(config);
