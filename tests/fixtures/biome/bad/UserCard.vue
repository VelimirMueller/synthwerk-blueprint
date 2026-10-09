<script lang="ts">
export default {
  props: { user: Object },
  data() {
    return { open: false }
  }
}
</script>

<template>
  <article class="card" dataTestId="user-card">
    <h2>{{ user.name }}</h2>
  </article>
</template>
