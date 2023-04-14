import { Subject, BehaviorSubject } from "rxjs" //RxJS 引入了 Observables,一个新的 JavaScript 推送体系。Observable 是多个值的生产者,并将值“推送”给观察者(消费者)
import { map } from "rxjs/operators"
import { assign, clone } from "lodash-es"
// 定义了一个箭头函数，返回类型是 Partial<StoreType>， Partial<StoreType> 将返回类型的所有属性设置为可选的
type dispatcherFunc<StoreType> = (
  currentVal: StoreType,
  payload: any
) => Partial<StoreType>

/**
 * Defines a dispatcher.
 *
 * This function exists to provide better typing for dispatch function.
 * As you can see, its pretty much an identity function.
 */
export const defineDispatchers = <StoreType, T>(
  // eslint-disable-next-line no-unused-vars
  dispatchers: { [_ in keyof T]: dispatcherFunc<StoreType> }
) => dispatchers

// Record<Keys,Type>
// 构造一个对象类型，其属性key是Keys,属性value是Tpye。被用于映射一个类型的属性到另一个类型
// interface CatInfo {
//     age: number,
//     breed: string
// }
// type CatName = 'miffy'| 'boris' | 'mordred' // 字符串字面量类型
// const cats: Record<CatName, CatInfo> ={
//     miffy: {age: 10, breed: "Persian"},
//     boris: {age:5, breed: 'Maine Coon'},
//     mordred: {age: 16, breed: 'British Shorthair'}
// };
type Dispatch<
  StoreType,
  DispatchersType extends Record<string, dispatcherFunc<StoreType>>
> = {
  dispatcher: keyof DispatchersType
  payload: any
}

// Subject 是一个代理对象，具有双重身份，既是一个 Observable，又是一个 Observer，它可以同时接受 Observable 发射出的数据，也可以向订阅了它的 observer 通过 next 发射数据。
// 同时，Subject 会对内部的 observers 清单进行多播(multicast)。
export default class DispatchingStore<
  StoreType,
  DispatchersType extends Record<string, dispatcherFunc<StoreType>>
> {
  #state$: BehaviorSubject<StoreType>
  #dispatchers: DispatchersType
  #dispatches$: Subject<Dispatch<StoreType, DispatchersType>> = new Subject() // 创建了一个新的 subject，然后调用 next 方法，多播给其所有的监听者

  constructor(initialValue: StoreType, dispatchers: DispatchersType) {
    this.#state$ = new BehaviorSubject(initialValue) // BehaviorSubject是subject的变种，BehaviorSubject具有subject的基本功能,BehaviorSubject在初始化的时候需要给一个默认的值
    this.#dispatchers = dispatchers

    this.#dispatches$
      .pipe(
        map(({ dispatcher, payload }) =>
          this.#dispatchers[dispatcher](this.value, payload)
        )
      )
      .subscribe((val) => {
        const data = clone(this.value)
        assign(data, val)

        this.#state$.next(data)
      })
  }

  get subject$() {
    return this.#state$
  }

  get value() {
    return this.subject$.value
  }

  get dispatches$() {
    return this.#dispatches$
  }
  // 函数参数解构赋值，使用类型注解为解构参数添加类型信息
  dispatch({ dispatcher, payload }: Dispatch<StoreType, DispatchersType>) {
    if (!this.#dispatchers[dispatcher])
      throw new Error(`Undefined dispatch type '${dispatcher}'`)

    this.#dispatches$.next({ dispatcher, payload })
  }
}
