import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import image from "@rollup/plugin-image";
import { wasm } from "@rollup/plugin-wasm";
import json from "@rollup/plugin-json";
import * as dotenv from "dotenv";
dotenv.config();

// TODO: Change 'dev' to 'production' before bundling for production
const NODE_ENV = JSON.stringify(process.env.NODE_ENV);

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
      // Bundled into temp folder. Browserify is then used to bundle into dist folder.
      file: "./rollup-temp/background.js",
      format: "es",
    },
    // shimMissingExports: true,
    inlineDynamicImports: true,
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      replace({
        "process.env.NODE_ENV": NODE_ENV,
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
    // Confirmation popup script
    input: "./src/frontend/popups/confirmation/index.js",
    output: {
      file: "./dist/confirmation_popup.js",
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
