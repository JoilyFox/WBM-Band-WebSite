<template>
  <CommonBaseModal :is-visible="isVisible" @close="emit('close')">
    <div class="member-modal-body">
      <h2 class="member-modal-name">{{ member ? $t(member.nameKey) : '' }}</h2>
    </div>
  </CommonBaseModal>
</template>

<script setup lang="ts">
  import type { TeamMember } from '~/data/teamMembers'

  interface Props {
    member: TeamMember | null
    isVisible: boolean
  }

  interface Emits {
    (e: 'close'): void
  }

  defineProps<Props>()
  const emit = defineEmits<Emits>()
</script>

<style scoped>
  .member-modal-body {
    padding: 4rem 2rem 3rem;
    text-align: center;
  }

  .member-modal-name {
    color: white;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.2;
  }

  @media (max-width: 768px) {
    .member-modal-body {
      padding: 3.5rem 1.5rem 2.5rem;
    }

    .member-modal-name {
      font-size: 1.5rem;
    }
  }
</style>
