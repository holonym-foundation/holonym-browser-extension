import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

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
    // Popup script
    input: "./src/default_popup/popup.js",
    output: {
      file: "./dist/popup.js",
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
];
