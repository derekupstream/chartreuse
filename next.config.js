import withLess from 'next-with-less';

const config = {
  compiler: {
    styledComponents: true
  },
  reactStrictMode: true,
  experimental: { esmExternals: 'loose' },
  // source: https://github.com/ant-design/ant-design/issues/46053
  transpilePackages: [ "antd", "@ant-design", "@antv/g2-extension-plot", "@ant-design/plots","d3-hierarchy", "rc-util", "rc-pagination", "rc-picker", "rc-notification", "rc-tooltip", "rc-tree", "rc-table" ],
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

export default withLess(config);
