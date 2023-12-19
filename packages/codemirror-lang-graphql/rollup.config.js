import typescript from "rollup-plugin-ts"
import { lezer } from "@lezer/generator/rollup"

export default {
  input: "src/index.js",
  external: (id) => id != "tslib" && !/^(\.?\/|\w:)/.test(id),
  output: [
    { file: "dist/index.cjs", format: "cjs" },
    { dir: "./dist", format: "es" },
  ],
  // 支持使用 TypeScript 进行开发，并将 TypeScript 文件转为 JavaScript 文件。
  plugins: [lezer(), typescript()],
}
