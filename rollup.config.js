import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default [
  {
    // Content script
    input: "./src/content/content_script.js",
    output: {
      file: "./dist/content_script.js",
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
    input: "./src/popup/popup.js",
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
