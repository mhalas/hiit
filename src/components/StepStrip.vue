<script setup lang="ts">
defineProps<{ segments: readonly number[] }>();
</script>

<template>
  <div class="step-strip" aria-hidden="true">
    <span v-for="(fill, index) in segments" :key="index" class="step-strip__segment">
      <span class="step-strip__fill" :style="{ width: `${fill * 100}%` }"></span>
    </span>
  </div>
</template>

<style scoped>
.step-strip {
  display: flex;
  gap: 3px;
}

.step-strip__segment {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: var(--screen-track);
}

.step-strip__fill {
  display: block;
  height: 100%;
  background: var(--screen-fg);
}
</style>
