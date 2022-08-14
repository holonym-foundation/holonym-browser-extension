import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

export default [
  {
    // Content script
    input: "./src/content/content.js",
    output: {
      file: "./dist/content.js",
      format: "es",
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
    ],
  },
  {
    // Background script
    input: "./src/background/background.js",
    output: {
      file: "./dist/background.js",
      format: "es",
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
    ],
  },
  {
    // Default popup script
    input: "./src/popups/default/index.js",
    output: {
      file: "./dist/default_popup.js",
      format: "es",
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      replace({
        // TODO: Change 'development' to 'production' before bundling for production
        "process.env.NODE_ENV": JSON.stringify("development"),
        preventAssignment: true,
      }),
      babel({
        presets: ["@babel/preset-react"],
      }),
      commonjs(),
    ],
  },
  {
    // Confirmation popup script
    input: "./src/popups/confirmation/index.js",
    output: {
      file: "./dist/confirmation_popup.js",
      format: "es",
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      replace({
        // TODO: Change 'development' to 'production' before bundling for production
        "process.env.NODE_ENV": JSON.stringify("development"),
        preventAssignment: true,
      }),
      babel({
        presets: ["@babel/preset-react"],
      }),
      commonjs(),
    ],
  },
];
