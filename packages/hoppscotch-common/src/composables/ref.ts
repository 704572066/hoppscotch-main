import { customRef, onBeforeUnmount, Ref, watch } from "vue"

export function pluckRef<T, K extends keyof T>(ref: Ref<T>, key: K): Ref<T[K]> {
  return customRef((track, trigger) => {
    /* vue3销毁watch监听在vue 3中，销毁watch监听可以通过调用stop方法来实现。当你调用watch方法时，它会返回一个带有stop方法的监听器对象。你只需要调用该方法即可停止监听。
    以下是一个示例:
    // 创建watch监听
    const stopwatch = watch(() => state.room, (newVal, oldVal) => {
      console.log("新值:"，newVal，"老值:"，oldVal);
    });
    //销watch监听
    stopWatch(); */
    const stopWatching = watch(ref, (newVal, oldVal) => {
      if (newVal[key] !== oldVal[key]) {
        trigger()
      }
    })

    onBeforeUnmount(() => {
      stopWatching()
    })

    return {
      get() {
        track()
        return ref.value[key]
      },
      set(value: T[K]) {
        trigger()
        // Object.assign()方法是用于将一个或多个源对象的属性复制到目标对象中的方法;
        // 如果目标对象中已有同名属性，则会覆盖原有属性的值。如果源对象中存在嵌套对象，则会进行浅复制，即只复制对象的引用而不是对象本身
        ref.value = Object.assign(ref.value, { [key]: value })
      },
    }
  })
}

export function pluckMultipleFromRef<T, K extends Array<keyof T>>(
  sourceRef: Ref<T>,
  keys: K
): { [key in K[number]]: Ref<T[key]> } {
  return Object.fromEntries(keys.map((x) => [x, pluckRef(sourceRef, x)])) as any
}
