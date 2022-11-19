module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
        [
          'module-resolver',
          {
            extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
          },
        ],
        [
          'react-native-reanimated/plugin',
        ],
      ],
};
