import { HoppModule } from "."
import NProgress from "nprogress" // NProgress 是一个轻量级的进度条组件
/* JavaScript 本身就有 typeof 操作符，你可以在表达式上下文中（expression context）使用：
// Prints "string"
console.log(typeof "Hello world");
复制代码
而 TypeScript 添加的 typeof 方法可以在类型上下文（type context）中使用，用于获取一个变量或者属性的类型。
let s = "hello";
let n: typeof s;
// let n: string
复制代码
如果仅仅用来判断基本的类型，自然是没什么太大用，和其他的类型操作符搭配使用才能发挥它的作用。
举个例子：比如搭配 TypeScript 内置的 ReturnTypep<T>。你传入一个函数类型，ReturnTypep<T> 会返回该函数的返回值的类型：
type Predicate = (x: unknown) => boolean;
type K = ReturnType<Predicate>;
/// type K = boolean
复制代码
如果我们直接对一个函数名使用 ReturnType ，我们会看到这样一个报错：
function f() {
  return { x: 10, y: 3 };
}
type P = ReturnType<f>;

// 'f' refers to a value, but is being used as a type here. Did you mean 'typeof f'?
复制代码
这是因为值（values）和类型（types）并不是一种东西。为了获取值 f 也就是函数 f 的类型，我们就需要使用 typeof：
function f() {
  return { x: 10, y: 3 };
}
type P = ReturnType<typeof f>;
                    
// type P = {
//    x: number;
//    y: number;
// }
*/
let deferedProgressHandle: ReturnType<typeof setTimeout> | null = null

/**
 * Starts animating the global progress bar
 * @param deferTime How much time to defer the global progress bar rendering to
 */
export const startPageProgress = (deferTime?: number) => {
  if (deferedProgressHandle) clearTimeout(deferedProgressHandle)

  // If deferTime is specified, queue it
  if (deferTime !== undefined) {
    deferedProgressHandle = setTimeout(() => {
      NProgress.start()
    }, deferTime)

    return
  }

  NProgress.start()
}

export const completePageProgress = () => {
  if (deferedProgressHandle) {
    clearTimeout(deferedProgressHandle)
    deferedProgressHandle = null
  }

  NProgress.done()
}

export const removePageProgress = () => {
  if (deferedProgressHandle) {
    clearTimeout(deferedProgressHandle)
    deferedProgressHandle = null
  }

  NProgress.remove()
}

export default <HoppModule>{
  onVueAppInit() {
    NProgress.configure({ showSpinner: false })
  },
  onBeforeRouteChange(to, from) {
    // Show progressbar on page change
    if (to.path !== from.path) {
      startPageProgress(500)
    }
  },
  onAfterRouteChange() {
    completePageProgress()
  },
}
