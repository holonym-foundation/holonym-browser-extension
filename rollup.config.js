import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import image from "@rollup/plugin-image";
import { wasm } from "@rollup/plugin-wasm";
import json from "@rollup/plugin-json";

const NODE_ENV = JSON.stringify(process.env.NODE_ENV);
const linkToStartVerification = "'https://holonym.id/verify'";
const frontendUrl =
  process.env.NODE_ENV == "dev" ? "'http://localhost:3002'" : "'https://holonym.io'";

export default [
  // {
  //   // Content script
  //   input: "./src/content/content.js",
  //   output: {
  //     file: "./dist/content.js",
  //     format: "es",
  //   },
  //   plugins: [
  //     resolve({
  //       browser: true,
  //       preferBuiltins: false,
  //     }),
  //     commonjs(),
  //   ],
  // },
  {
    // Background script
    input: "./src/background/background.js",
    output: {
      file: "./dist/background.js",
      format: "es",
    },
    // shimMissingExports: true,
    inlineDynamicImports: true,
    plugins: [
      json(),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      replace({
        "process.env.NODE_ENV": NODE_ENV,
        'require("stream");': 'require("readable-stream");',
        preventAssignment: true,
      }),
      commonjs(),
      wasm({
        targetEnv: "browser",
      }),
    ],
  },
  {
    // Default popup script
    input: "./src/frontend/popups/default/index.js",
    output: {
      file: "./dist/default_popup.js",
      format: "es",
    },
    plugins: [
      json(), // needed for MetaMask
      image(),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      replace({
        "process.env.NODE_ENV": NODE_ENV,
        "process.env.LINK_TO_START_VERIFICATION": linkToStartVerification,
        "process.env.FRONTEND_URL": frontendUrl,
        preventAssignment: true,
      }),
      babel({
        presets: ["@babel/preset-react"],
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      commonjs(),
    ],
  },
  {
    // Credentials (add) confirmation popup script
    input: "./src/frontend/popups/confirmation-credentials/index.js",
    output: {
      file: "./dist/credentials_confirmation_popup.js",
      format: "es",
    },
    plugins: [
      // json(), // needed for MetaMask
      image(),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      replace({
        "process.env.NODE_ENV": NODE_ENV,
        'require("stream");': 'require("readable-stream");',
        preventAssignment: true,
      }),
      babel({
        presets: ["@babel/preset-react"],
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      commonjs(),
    ],
  },
  {
    // Credentials (share) confirmation popup script
    input: "./src/frontend/popups/confirmation-share-creds/index.js",
    output: {
      file: "./dist/share_creds_confirmation_popup.js",
      format: "es",
    },
    plugins: [
      // json(), // needed for MetaMask
      image(),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      replace({
        "process.env.NODE_ENV": NODE_ENV,
        'require("stream");': 'require("readable-stream");',
        preventAssignment: true,
      }),
      babel({
        presets: ["@babel/preset-react"],
        babelHelpers: "bundled",
        exclude: "node_modules/**",
      }),
      commonjs(),
    ],
  },
];
