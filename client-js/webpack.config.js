const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'Icesi Live Arena',
    }),
  ],
  devServer: {
    static: './dist',
    port: 3000,
    open: true,
    hot: true,
    client: {
      overlay: false,
    },
  },
  ignoreWarnings: [
    /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
  ],
  resolve: {
    extensions: ['.js'],
    fallback: {
      fs: false,
      net: false,
    },
  },
};
