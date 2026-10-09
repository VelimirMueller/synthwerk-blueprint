<script setup lang="ts">
import type { User } from './user'

defineProps<{ user: User }>()
</script>

<template>
  <article class="card" data-test-id="user-card">
    <h2>{{ user.name }}</h2>
  </article>
</template>
