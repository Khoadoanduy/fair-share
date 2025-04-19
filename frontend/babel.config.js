module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Expo Router uses React Navigation under the hood
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['.'],
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
          alias: {
            // Align with tsconfig.json paths
            '@': './',
            '@components': './components',
            '@assets': './assets',
            '@screens': './screens',
            '@hooks': './hooks',
            '@constants': './constants',
            '@utils': './utils'
          }
        }
      ]
    ]
  };
};
