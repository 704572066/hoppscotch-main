// 用 props ，只能一级一级传递下去，那就太繁琐了，因此我们需要更直接的通信方式。全局组件通信之provide / inject
// inject() can only be used inside setup() or functional components.
import { inject } from "vue"
import { HoppColorMode } from "~/modules/theming"

//  通过 provide 注入一个应用范围内所有组件都可以使用的值, 应用范围内任意组件要使用provide提供的的值时，都可以通过 inject 进行接收
export const useColorMode = () => inject("colorMode") as HoppColorMode
