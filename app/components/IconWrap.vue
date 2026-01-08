<template>
  <span class="icon-wrap" aria-hidden="true">
    <slot />
  </span>
</template>

<style scoped>
.icon-wrap :deep(svg) {
  width: 1.1em;
  height: 1.1em;
  flex: 0 0 auto;
  display: block;
}
</style>
