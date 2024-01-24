<template>
  <div ref="container">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"

/*
  Implements a wrapper listening to viewport intersections via
  IntersectionObserver API

  Events
  ------
  intersecting (entry: IntersectionObserverEntry) -> When the component is intersecting the viewport
*/
/* 1. IntersectionObserver
我们先来简单了解下这个 api 的使用方法。

IntersectionObserver 有两个参数，new IntersectionObserver(callback, options)，callback 是当触发可见性时执行的回调，options 是相关的配置。

// 初始化一个对象
const io = new IntersectionObserver(
  (entries) => {
    // entries是一个数组
    console.log(entries);
  },
  {
    threshold: [0, 0.5, 1], // 触发回调的节点，0表示元素刚完全不可见，1表示元素刚完全可见，0.5表示元素可见了一半等
  },
);
// 监听dom对象，可以同时监听多个dom元素
io.observe(document.querySelector('.dom1'));
io.observe(document.querySelector('.dom2'));

// 取消监听dom元素
io.unobserve(document.querySelector('.dom2'));

// 关闭观察器
io.disconnect();
在 callback 中的 entries 参数是一个IntersectionObserverEntry类型的数组。

主要有 6 个元素：


{
  time: 3893.92,
  rootBounds: ClientRect {
    bottom: 920,
    height: 1024,
    left: 0,
    right: 1024,
    top: 0,
    width: 920
  },
  boundingClientRect: ClientRect {
     // ...
  },
  intersectionRect: ClientRect {
    // ...
  },
  intersectionRatio: 0.54,
  target: element
}
各个属性的含义：

{
  time: 触发该行为的时间戳（从打开该页面开始计时的时间戳），单位毫秒
  rootBounds: 视窗的尺寸,
  boundingClientRect: 被监听元素的尺寸,
  intersectionRect: 被监听元素与视窗交叉区域的尺寸,
  intersectionRatio: 触发该行为的比例,
  target: 被监听的dom元素
}
我们利用页面可见性的特点，可以做很多事情，比如组件懒加载、无限滚动、监控组件曝光等。 */
const observer = ref<IntersectionObserver>()
const container = ref<Element>()

const emit = defineEmits<{
  (e: "intersecting", entry: IntersectionObserverEntry): void
}>()

onMounted(() => {
  observer.value = new IntersectionObserver(([entry]) => {
    // isIntersecting  一个类型为布尔值的数据 当被监听元素进入视口区域时为 true ,离开视口区域时为 false；
    if (entry && entry.isIntersecting) {
      emit("intersecting", entry)
    }
  })
  // 非空断言操作符!可以用来告诉编译器一个值一定不为null或undefined
  observer.value.observe(container.value!)
})

onBeforeUnmount(() => {
  observer.value!.disconnect()
})
</script>
