// 在使用ts开发的项目中，.d.ts 结尾的文件主要用于 TypeScript 识别.vue 文件，.vue 文件不是一个常规的文件类型，ts 是不能理解 vue 文件是干嘛的，这里就告诉 ts，vue 文件是这种类型的。
// 没有这个文件中的declare声明文件，会发现 import 的所有 vue 类型的文件都会报错。
// 并且js本身是没有类型的，ts的语言服务需要.d.ts文件来识别类型，这样才能做到相应的语法检查和智能提示。

/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
