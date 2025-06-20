import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlInlineScriptPlugin from 'html-inline-script-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  devtool: argv.mode === 'production' ? false : 'inline-source-map',
  
  entry: {
    ui: './src/ui.tsx',
    code: './src/code.ts'
  },
  
  module: {
    rules: [
      { 
        test: /\.tsx?$/, 
        use: 'ts-loader', 
        exclude: /node_modules/ 
      },
      { 
        test: /\.css$/, 
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui.html',
      filename: 'ui.html',
      chunks: ['ui'],
      inject: 'body'
    }),
    new HtmlInlineScriptPlugin({
      scriptMatchPattern: [/ui\.js$/]
    })
  ]
});