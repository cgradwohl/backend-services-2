const SentryCli = require("@sentry/cli");
const path = require("path");
const slsw = require("serverless-webpack");
const { BannerPlugin, EnvironmentPlugin } = require("webpack");
const nodeExternals = require("webpack-node-externals");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

async function getVersion() {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA;
  }

  return await new SentryCli().releases.proposeVersion();
}

module.exports = (async () => ({
  devtool: "source-map",
  entry: slsw.lib.entries,
  resolve: {
    extensions: [".js", ".json", ".ts", ".tsx", ".hbs"],
    plugins: [
      new TsconfigPathsPlugin({
        /* options: see below */
      }),
    ],
  },
  output: {
    libraryTarget: "commonjs2",
    path: path.join(__dirname, ".webpack"),
    filename: "[name].js",
  },
  externals: [
    process.env.ANALYZE
      ? undefined
      : nodeExternals({
          importType: "commonjs2",
        }),
    {
      "aws-sdk": "aws-sdk",
    },
  ].filter(Boolean),
  target: "node",
  mode: process.env.ENV || "development",
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        use: [
          {
            loader: "ts-loader",
            /* HACK: below was set because otherwise Webpack ran out of mem, but we lose runtime typecheck; see:
            https://github.com/serverless-heaven/serverless-webpack/issues/299
            */
            options: { transpileOnly: true },
          },
        ],
      },
      {
        test: /\.hbs$/,
        use: "raw-loader",
      },
    ],
  },
  plugins: [
    process.env.ANALYZE ? new BundleAnalyzerPlugin() : undefined,
    new EnvironmentPlugin({
      SENTRY_ENV: process.env.SENTRY_ENV || "development",
      SENTRY_VERSION: await getVersion(),
    }),
    new BannerPlugin({
      banner: "require('source-map-support').install();",
      raw: true,
      entryOnly: false,
    }),
  ].filter(Boolean),
}))();
