/* eslint-disable @typescript-eslint/no-var-requires */
// Webpack config file uses CommonJS require for Node.js compatibility
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');

// eslint-disable-next-line max-lines-per-function -- Webpack configuration requires comprehensive setup including entry points, output, module rules, resolve aliases, optimization settings, and plugins. Splitting would fragment the cohesive webpack configuration.
module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    bail: false, // Continue building even if there are errors
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
    },
    devtool: isProduction ? false : 'cheap-source-map',
    externals: {
      // googleapis cannot run in browser environment (uses node-fetch and Node.js modules)
      // SpreadsheetSyncAdapter will throw error at runtime if attempted to connect
      googleapis: 'commonjs googleapis',
    },
    entry: {
      background: {
        import: './src/presentation/background/index.ts',
        filename: 'background.js',
        chunkLoading: 'import-scripts', // Service Worker requires import-scripts for chunk loading
      },
      popup: './src/presentation/popup/index.ts',
      'xpath-manager': './src/presentation/xpath-manager/index.ts',
      'system-settings': './src/presentation/system-settings/index.ts',
      'automation-variables-manager': './src/presentation/automation-variables-manager/index.ts',
      'storage-sync-manager': './src/presentation/storage-sync-manager/index.ts',
      'security-log-viewer': './src/presentation/security-log-viewer/index.ts',
      'content-script': './src/presentation/content-script/index.ts',
      'master-password-setup': './src/presentation/master-password-setup/index.ts',
      unlock: './src/presentation/unlock/index.ts',
      offscreen: './src/presentation/offscreen/index.ts',
      tailwind: './public/styles/tailwind.css',
      'app-store': './src/presentation/stores/AppStore.ts',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      chunkFilename: '[name].js',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: false, // Keep type checking
              // Allow emit with errors (for development)
              ...(!isProduction && { configFile: 'tsconfig.json' }),
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
      modules: ['node_modules', path.resolve(__dirname, 'src')],
      symlinks: false,
      cacheWithContext: false,
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@domain': path.resolve(__dirname, 'src/domain'),
        '@usecases': path.resolve(__dirname, 'src/usecases'),
        '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
        '@presentation': path.resolve(__dirname, 'src/presentation'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@tests': path.resolve(__dirname, 'tests'),
        // Performance optimizations
        '@performance': path.resolve(__dirname, 'src/utils'),
        // Handle node: URI scheme (Node.js 16+) for browser environment
        'node:buffer': false,
        'node:fs': false,
        'node:http': false,
        'node:https': false,
        'node:http2': false,
        'node:net': false,
        'node:path': false,
        'node:process': false,
        'node:stream': false,
        'node:stream/web': false,
        'node:url': false,
        'node:util': false,
        'node:zlib': false,
      },
      fallback: {
        // Node.js core modules required by googleapis/gaxios
        // For Chrome extension environment, these are disabled as they cannot run in browser
        fs: false,
        child_process: false,
        net: false,
        tls: false,
        http: false,
        https: false,
        http2: false,
        stream: false,
        crypto: false,
        querystring: false,
        os: false,
        path: false,
        assert: false,
        url: false,
        util: false,
        zlib: false,
        buffer: false,
        process: false,
        worker_threads: false,
        // Node-fetch and related dependencies used by googleapis
        // These are Node.js-only modules that cannot run in browser
        'node-fetch': false,
        'fetch-blob': false,
        'formdata-polyfill': false,
        'data-uri-to-buffer': false,
      },
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: false,
              pure_funcs: isProduction ? ['console.log', 'console.debug'] : [],
              drop_debugger: true,
              passes: 3,
              unsafe_arrows: true,
              unsafe_methods: true,
              unsafe_proto: true,
            },
            mangle: {
              properties: {
                regex: /^_(secret|key|password|token|encrypted|auth)/,
              },
              toplevel: true,
            },
            keep_classnames: false,
            keep_fnames: false,
          },
          parallel: true,
          extractComments: false,
        }),
      ],
      usedExports: true,
      sideEffects: false,
      concatenateModules: true,
      providedExports: true,
      innerGraph: true,
      mangleExports: isProduction,
      splitChunks: {
        // Only enable code splitting for background (Service Worker)
        // Other entry points (popup, settings, etc.) are bundled as single files
        // This avoids the need for HtmlWebpackPlugin to inject vendor chunk script tags
        chunks(chunk) {
          return chunk.name === 'background';
        },
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        minSize: 20000,
        maxSize: 1048576, // 1MB
        cacheGroups: {
          // Split large vendor libraries into separate chunks
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
            // Split vendors into smaller chunks if they exceed 1MB
            maxSize: 1048576, // 1MB
          },
          // Common modules shared across entry points
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    },
    plugins: [
      new webpack.DefinePlugin({
        // Define process.env for browser environment
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
        // Define process object for typeof checks
        'typeof process': JSON.stringify('object'),
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
      ...(isProduction ? [
        new webpack.optimize.ModuleConcatenationPlugin(),
        new webpack.ids.HashedModuleIdsPlugin(),
      ] : []),
      new CopyPlugin({
        patterns: [
          { from: 'public', to: '.' },
          { from: '_locales', to: '_locales' }, // Copy master _locales folder (overrides public/_locales)
        ],
      }),
      new MiniCssExtractPlugin({
        filename: 'styles/[name].css',
        chunkFilename: 'styles/[id].css',
      }),
      // Handle node: URI scheme (Node.js 16+) by replacing with empty modules
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        const mod = resource.request.replace(/^node:/, '');
        // Map to empty module for browser environment
        resource.request = path.resolve(__dirname, 'node_modules/.cache/empty-module.js');
      }),
    ],
    performance: {
      hints: isProduction ? 'warning' : false,
      maxAssetSize: 2097152, // 2MB
      maxEntrypointSize: 2097152, // 2MB
      assetFilter: (assetFilename) => {
        return !assetFilename.endsWith('.map');
      },
    },
    stats: {
      colors: true,
      modules: false,
      chunks: false,
      chunkModules: false,
      entrypoints: false,
      assets: isProduction,
    },
  };
};
