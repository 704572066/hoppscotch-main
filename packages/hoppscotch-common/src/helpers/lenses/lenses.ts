import { HoppRESTResponse } from "../types/HoppRESTResponse"
import jsonLens from "./jsonLens"
import rawLens from "./rawLens"
import imageLens from "./imageLens"
import htmlLens from "./htmlLens"
import xmlLens from "./xmlLens"
import pdfLens from "./pdfLens"
/* defineAsyncComponent 是 Vue 3 的一个方法，用于异步组件的注册。它允许我们在组件需要的时候再进行加载，避免无意义的网络请求，提高应用性能。

使用 defineAsyncComponent 首先需要定义一个异步组件，可以使用类似 import() 这样的语法动态导入组件：

const Foo = () => import('./Foo.vue')
然后可以使用 defineAsyncComponent 方法将该异步组件进行注册。例如：

import { defineAsyncComponent } from 'vue'
const AsyncComponent = defineAsyncComponent(() => import('./Foo.vue'))
export default {
  components: { AsyncComponent }
​​​​​​​}
这里我们将 Foo.vue 动态导入后，使用 defineAsyncComponent 方法将其转换成一个异步组件，并使用 AsyncComponent 注册到父组件中。

当父组件需要渲染 AsyncComponent 时，会自动触发异步组件的加载，等待组件加载完成后再进行渲染。这样可以有效地避免在不需要的情况下加载无用的组件，提高应用性能和用户体验。
 */
import { defineAsyncComponent } from "vue"
/* 1、类型推导
ReturnType可以帮助我们推导出函数的返回值类型。在下面的例子中，我们定义了一个add函数，它接受两个数字参数并返回它们的和，我们可以使用ReturnType类型查询来判断它的返回值类型：

function add(a: number, b: number): number {
  return a + b;
}

type AddReturnType = ReturnType<typeof add>;
// 类型为number
我们使用ReturnType类型查询获取了add函数的返回值类型并赋值给AddReturnType，它的类型是number。 */
export type Lens = {
  lensName: string
  isSupportedContentType: (contentType: string) => boolean
  renderer: string
  rendererImport: ReturnType<typeof defineAsyncComponent>
}

export const lenses: Lens[] = [
  jsonLens,
  imageLens,
  htmlLens,
  xmlLens,
  pdfLens,
  rawLens,
]

export function getSuitableLenses(response: HoppRESTResponse): Lens[] {
  // return empty array if response is loading or error
  if (
    response.type === "loading" ||
    response.type === "network_fail" ||
    response.type === "script_fail" ||
    response.type === "fail"
  )
    return []

  const contentType = response.headers.find((h) => h.key === "content-type")

  if (!contentType) return [rawLens]

  const result = []
  for (const lens of lenses) {
    if (lens.isSupportedContentType(contentType.value)) result.push(lens)
  }
  return result
}
// 定义了对象中键值的类型, 允许定义任意多的键值对
type LensRenderers = {
  [key: string]: Lens["rendererImport"]
}

export function getLensRenderers(): LensRenderers {
  const response: LensRenderers = {}
  for (const lens of lenses) {
    response[lens.renderer] = lens.rendererImport
  }
  return response
}
