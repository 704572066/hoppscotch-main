<template>
  <div
    tabindex="0"
    class="relative flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring focus-visible:ring-primaryDark"
    :class="[`rounded-${rounded}`, `w-${size} h-${size}`]"
  >
    <img
      v-if="url"
      class="absolute object-cover object-center transition bg-primaryDark"
      :class="[`rounded-${rounded}`, `w-${size} h-${size}`]"
      :src="url"
      :alt="alt"
      loading="lazy"
    />
    <div
      v-else
      class="absolute flex items-center justify-center object-cover object-center transition bg-primaryDark text-accentContrast"
      :class="[`rounded-${rounded}`, `w-${size} h-${size}`]"
      :style="`background-color: ${initial ? toHex(initial) : '#480000'}`"
    >
      <template v-if="initial && initial.charAt(0).toUpperCase()">
        {{ initial.charAt(0).toUpperCase() }}
      </template>

      <icon-lucide-user v-else></icon-lucide-user>
    </div>
    <span
      v-if="indicator"
      class="border-primary border-2 h-2.5 -top-0.5 -right-0.5 w-2.5 absolute"
      :class="[`rounded-${rounded}`, indicatorStyles]"
    ></span>
    <!-- w-5 h-5 rounded-lg -->
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue"

export default defineComponent({
  props: {
    url: {
      type: String,
      default: "",
    },
    alt: {
      type: String,
      default: "Profile picture",
    },
    indicator: {
      type: Boolean,
      default: false,
    },
    indicatorStyles: {
      type: String,
      default: "bg-green-500",
    },
    rounded: {
      type: String,
      default: "full",
    },
    size: {
      type: String,
      default: "5",
    },
    initial: {
      type: String as PropType<string | undefined | null>, // string是TypeScript的原始数据类型，针对于数组，和对象，我们就只能对类型限定，而不能确定其内部属性的内容的类型，这是不符合TS标准的,所以vue3提供一个泛型接口，用来处理数组和对象
      default: "",
    },
  },
  methods: {
    toHex(initial: string) {
      let hash = 0
      if (initial.length === 0) return hash
      for (let i = 0; i < initial.length; i++) {
        hash = initial.charCodeAt(i) + ((hash << 5) - hash)
        hash = hash & hash
      }
      let color = "#"
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 255
        color += `00${value.toString(16)}`.slice(-2)
      }
      return color
    },
  },
})
</script>
