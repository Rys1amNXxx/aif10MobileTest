// babel.config.js
module.exports = {
  presets: ['@vue/cli-plugin-babel/preset'],
  plugins: [
    [
      'import',
      {
        libraryName: '@atom/atom-ui',
        libraryDirectory: 'es',
        style: true,
      },
      '@atom/atom-ui',
    ],
  ],
};