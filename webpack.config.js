const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const WebSocket = require("ws");
const ExpressWs = require("express-ws");
const CompressionPlugin = require("compression-webpack-plugin");
const AddAssetWebpackPlugin = require("add-asset-webpack-plugin");
const toposort = require("toposort");
const CopyPlugin = require("copy-webpack-plugin")
const {sentryWebpackPlugin} = require('@sentry/webpack-plugin');
const { execSync } = require("child_process")
const webpack = require("webpack")
const { styles } = require('@ckeditor/ckeditor5-dev-utils');
const { config } = require("dotenv")
config()

const PRODUCTION = !!process.env.PRODUCTION;

const VERSION = execSync("node_modules/.bin/sentry-cli releases propose-version", { encoding: 'utf-8' }).trim()
/*
// This plugin adds the splits of the main entry to the tml
class HtmlDependencyWebpackPlugin {
  apply(compiler) {
    compiler.plugin("compilation", compilation => {
      compilation.plugin("html-webpack-plugin-alter-chunks", (chunks, init) => {
        const stats = compilation.getStats().toJson();
        const allChunks = stats.chunks;

        const result = [];
        for (const chunk of chunks) {
          for (const sibling of chunk.siblings) {
            for (const other of allChunks) {
              if (other.id === sibling) {
                result.push(other);
              }
            }
          }
          result.push(chunk);
        }
        return result;
      });
    });
  }
}*/

module.exports = {
  mode: PRODUCTION ? "production" : "development",
  entry: {
    main: "./src/app/boot.js",
    sw: "./src/app/sw/index.js",
  },
  devtool: "source-map",
  devServer: {
    hot: false,
    liveReload: true,
//    inline: false,
    static: path.join(__dirname, "public"),
    proxy: {
      "/api": {
        target: "ws://localhost:8999",
        ws: true
      },
      "/print": {
        target: "ws://localhost:8999"
      },
      "/survey": {
        target: "ws://localhost:8999"
      },
      "/projects": {
        target: "http://localhost:8999"
      },
      "/server": {
        target: "ws://localhost:8999"
      },
      "/request-project-number": {
        target: "ws://localhost:8999"
      },
      "/email": {
        target: "ws://localhost:8999"
      },

    }
  },
  module: {
    rules: [
      {
        test: /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
        use: ['raw-loader']
      },
      {
        test: /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              injectType: 'singletonStyleTag'
            }
          },
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: styles.getPostCssConfig({
                themeImporter: {
                  themePath: require.resolve('@ckeditor/ckeditor5-theme-lark')
                },
                minify: true
              })
            }
          }
        ]
      },
      {
        test: /\.tsx?/,
        use: [
          {
            loader: "ts-loader",
            options: { transpileOnly: true, compilerOptions: { module: "esnext" } }
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        exclude: /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/,

        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              // you can specify a publicPath here
              // by default it use publicPath in webpackOptions.output
              publicPath: "../"
            }
          },
          "css-loader"
        ]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: "file-loader",
        options: {
          name: 'public/fonts/[name].[ext]'
        },
        exclude: [
          /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
          /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "static/[hash].[ext]"
            }
          }
        ],
        exclude: [
          /ckeditor5-[^/\\]+[/\\]theme[/\\]icons[/\\][^/\\]+\.svg$/,
          /ckeditor5-[^/\\]+[/\\]theme[/\\].+\.css$/
        ],
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "zlib": "zlibad"
    },
    fallback: { 
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer"),
      "assert": require.resolve("assert"),
      "zlib": false
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      mobile: true,
      chunks: ["main"],
      title: "Dropsheet",
      links: [
        { rel: "apple-touch-icon", sizes: "57x57", href: "/apple-icon-57x57.png" },
        { rel: "apple-touch-icon", sizes: "60x60", href: "/apple-icon-60x60.png" },
        { rel: "apple-touch-icon", sizes: "72x72", href: "/apple-icon-72x72.png" },
        { rel: "apple-touch-icon", sizes: "76x76", href: "/apple-icon-76x76.png" },
        { rel: "apple-touch-icon", sizes: "114x114", href: "/apple-icon-114x114.png" },
        { rel: "apple-touch-icon", sizes: "120x120", href: "/apple-icon-120x120.png" },
        { rel: "apple-touch-icon", sizes: "144x144", href: "/apple-icon-144x144.png" },
        { rel: "apple-touch-icon", sizes: "152x152", href: "/apple-icon-152x152.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-icon-180x180.png" },
        { rel: "icon", type: "image/png", sizes: "192x192", href: "/android-icon-192x192.png" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      ]
    }),
    new CopyPlugin({
      patterns: [{
        from: "public",
        to: ""
      }]
    }),
//    new HtmlDependencyWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "static/[name].[contenthash].css"
    }),
    new CompressionPlugin(),
    new AddAssetWebpackPlugin("sw.js", data => {
      const stats = data.getStats().toJson();
      const filenames = stats.assets
        .filter(asset => !asset.name.endsWith(".map") && !asset.name.endsWith('.gz'))
        .map(asset => "/" + asset.name);
      return (
        "self.ALL_ASSETS=" +
        JSON.stringify(filenames) +
        ";importScripts(" +
        stats.entrypoints.sw.assets
          .filter(asset => {
            return !asset.name.endsWith(".map")
          })

          .map(asset => JSON.stringify("/" + asset.name))
          .join(",")
        + ")"
      );
    }),
    sentryWebpackPlugin({
      include: '.',
      org: 'remdal',
      project: 'dropsheet',
      ignoreFile: '.sentrycliignore',
      ignore: ['node_modules', 'webpack.config.js'],
      configFile: 'sentry.properties',
      dryRun: !PRODUCTION,
      auto: true,
      authToken: '87a6d6f1267e4a7ca25b7162ddca6d20b2821cd26ee0463aa2bbc4c803181272'
    }),
    new webpack.DefinePlugin({
      'process.env.VERSION': JSON.stringify(VERSION),
      'process.env.VAPID_PUBLIC_KEY': JSON.stringify(process.env.VAPID_PUBLIC_KEY)
    }),
    // Work around for Buffer is undefined:
    // https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
        process: 'process/browser.js',
    }),
  ],
  output: {
    filename: "static/[name].[contenthash].js",
    globalObject: "this"
  },
  optimization: {
    splitChunks: {
      chunks: "all"
    },
  }
};
