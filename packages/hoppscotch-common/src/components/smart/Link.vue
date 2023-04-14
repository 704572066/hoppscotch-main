<template>
  <button
    v-if="renderedTag === 'BUTTON'"
    aria-label="button"
    role="button"
    v-bind="$attrs"
  >
    <slot></slot>
  </button>
  <a
    v-else-if="renderedTag === 'ANCHOR' && !blank"
    aria-label="Link"
    :href="to"
    role="link"
    v-bind="updatedAttrs"
  >
    <slot></slot>
  </a>
  <a
    v-else-if="renderedTag === 'ANCHOR' && blank"
    aria-label="Link"
    :href="to"
    role="link"
    target="_blank"
    rel="noopener"
    v-bind="updatedAttrs"
  >
    <slot></slot>
  </a>
  <RouterLink v-else :to="to" v-bind="updatedAttrs">
    <slot></slot>
  </RouterLink>
</template>

<script lang="ts">
/**
 * for preventing the automatic binding of $attrs.
 * we are manually binding $attrs or updatedAttrs.
 * if this is not set to false, along with manually binded updatedAttrs, it will also bind $attrs.
 */

// 配置项的缺失，有时候我们需要更改组件选项，在setup中我们目前是无法做到的。我们需要在上方再引入一个 script，在上方写入对应的 export即可，需要单开一个 script。
// <script setup> 可以和普通的 <script> 一起使用。普通的 <script> 在有这些需要的情况下或许会被使用到：
// 无法在 <script setup> 声明的选项，例如 inheritAttrs 或通过插件启用的自定义的选项。
// 声明命名导出。
// 运行副作用或者创建只需要执行一次的对象。
// 在script setup 外使用export default，其内容会被处理后放入原组件声明字段。
export default {
  inheritAttrs: false, //禁止组件的默认透传行为
}
</script>

<script setup lang="ts">
import { computed, useAttrs } from "vue"
import { RouterLink } from "vue-router"
import { omit } from "lodash-es"
// defineProps属于vue3提供的宏，并不需要引入
// defineProps ----> [用来接收父组件传来的 props] 通过defineProps指定当前 props 类型，获得上下文的props对象。
const props = defineProps({
  to: {
    type: String,
    default: "",
  },
  blank: {
    type: Boolean,
    default: false,
  },
})

const renderedTag = computed(() => {
  if (!props.to) {
    return "BUTTON" as const
  } else if (props.blank) {
    return "ANCHOR" as const
  } else if (/^\/(?!\/).*$/.test(props.to)) {
    // regex101.com/r/LU1iFL/1
    return "FRAMEWORK" as const
  } else {
    return "ANCHOR" as const
  }
})

const $attrs = useAttrs()

/**
 * tippy checks if the disabled attribute exists on the anchor tag, if it exists it won't show the tooltip.
 * and when directly binding the disabled attribute using v-bind="attrs",
 * vue renders the disabled attribute as disabled="false" ("false" being a string),
 * which causes tippy to think the disabled attribute is present, ( it does a targetElement.hasAttribute("disabled") check ) and it won't show the tooltip.
 *
 * here we are just omiting disabled if it is false.
 */
const updatedAttrs = computed(() =>
  renderedTag.value === "ANCHOR" && !$attrs.disabled
    ? omit($attrs, "disabled") // omit它的作用主要是：以一个类型为基础支持剔除某些属性，然后返回一个新类型。
    : $attrs
)
</script>
