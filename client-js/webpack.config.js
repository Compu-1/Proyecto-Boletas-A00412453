const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
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
      template: './public/index.html',
      title: 'Icesi Live Arena — Reserva de Boletas',
    }),
  ],
  devServer: {
    static: './dist',
    port: 3000,
    open: false,
    hot: true,
  },
  resolve: {
    extensions: ['.js'],
    fallback: {
      fs: false,
      net: false,
    },
  },
};
