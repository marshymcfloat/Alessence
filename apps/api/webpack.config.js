const path = require('path');

module.exports = function (options) {
  return {
    ...options,
    resolve: {
      ...options.resolve,
      alias: {
        ...(options.resolve?.alias || {}),
        'src': path.resolve(__dirname, 'src'),
      },
    },
  };
};

