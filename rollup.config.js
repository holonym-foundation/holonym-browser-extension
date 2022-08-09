import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

export default {
  // Content scripts
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
};
