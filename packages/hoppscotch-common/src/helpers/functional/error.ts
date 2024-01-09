/* 在 TypeScript 中，never 类型表示那些永远不会发生的类型。 
如果一个函数永远不会返回（例如抛出异常或进入无限循环），可以将其返回类型标注为 never
void 类型也可以用于声明函数的返回值类型来表示函数没有任何返回值，但是 void 所表示的意思就不那么明确了。
使用 void 的话，函数是可以返回 undefined 的，而采用 never 则不允许函数返回 undefined。 */
export const throwError = (message: string): never => {
  throw new Error(message)
}
