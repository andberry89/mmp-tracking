<template>
  <section class="task-tag-editor" :aria-labelledby="`${inputId}-label`">
    <label :id="`${inputId}-label`" class="task-tag-editor__label" :for="inputId">Event tags</label>
    <p class="task-tag-editor__help">
      Group related Active Work tasks. Tags are cleared when a task is Published or Updated.
    </p>
    <div v-if="modelValue.length" class="task-tag-editor__chips" aria-label="Selected event tags">
      <span
        v-for="tag in modelValue"
        :key="tag"
        class="task-tag-editor__chip"
        :style="getEventTagStyle(tag)"
      >
        {{ tag }}
        <button
          type="button"
          :disabled="disabled"
          :aria-label="`Remove ${tag} tag`"
          @click="removeTag(tag)"
        >×</button>
      </span>
    </div>
    <div v-if="availableSuggestions.length" class="task-tag-editor__existing">
      <span class="task-tag-editor__existing-label">Existing Active Work tags</span>
      <div class="task-tag-editor__suggestions" aria-label="Choose an existing event tag">
        <button
          v-for="tag in availableSuggestions"
          :key="tag"
          type="button"
          class="task-tag-editor__suggestion"
          :style="getEventTagStyle(tag)"
          :disabled="disabled"
          @click="addSuggestedTag(tag)"
        >
          + {{ tag }}
        </button>
      </div>
    </div>
    <div class="task-tag-editor__add">
      <input
        :id="inputId"
        v-model="draft"
        type="text"
        maxlength="50"
        :list="`${inputId}-suggestions`"
        :disabled="disabled"
        placeholder="e.g. New York Auto Show"
        @keydown.enter.prevent="addTag"
      />
      <datalist :id="`${inputId}-suggestions`">
        <option v-for="tag in availableSuggestions" :key="tag" :value="tag" />
      </datalist>
      <button type="button" class="secondary-button" :disabled="disabled || !draft.trim()" @click="addTag">
        Add tag
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { normalizeTaskTags } from "@/utils/normalize-task-tags";
import { getEventTagStyle } from "@/utils/event-tag-style";

const props = withDefaults(defineProps<{
  modelValue: string[];
  suggestions?: string[];
  disabled?: boolean;
  inputId?: string;
}>(), {
  suggestions: () => [],
  disabled: false,
  inputId: "task-event-tag-input",
});
const emit = defineEmits<{ (event: "update:modelValue", tags: string[]): void }>();
const draft = ref("");
const inputId = computed(() => props.inputId);
const availableSuggestions = computed(() => props.suggestions.filter((tag) =>
  !props.modelValue.some((selected) => selected.toLocaleLowerCase() === tag.toLocaleLowerCase())
));

function addTag() {
  const tags = normalizeTaskTags([...props.modelValue, draft.value]);
  if (tags.length > props.modelValue.length) emit("update:modelValue", tags);
  draft.value = "";
}

function addSuggestedTag(tag: string) {
  emit("update:modelValue", normalizeTaskTags([...props.modelValue, tag]));
}

function removeTag(tagToRemove: string) {
  emit("update:modelValue", props.modelValue.filter((tag) => tag !== tagToRemove));
}
</script>

<style scoped>
.task-tag-editor { display: grid; gap: 6px; }
.task-tag-editor__label { color: var(--gray-dark-3); font-size: 0.82rem; font-weight: 700; }
.task-tag-editor__help { margin: -2px 0 0; color: var(--gray-light-4); font-size: 0.73rem; }
.task-tag-editor__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.task-tag-editor__existing { display: grid; gap: 5px; }
.task-tag-editor__existing-label { color: var(--gray-light-4); font-size: 0.7rem; font-weight: 600; }
.task-tag-editor__suggestions { display: flex; flex-wrap: wrap; gap: 5px; }
.task-tag-editor__suggestion { min-height: 26px; padding: 3px 8px; border: 1px solid var(--event-tag-border); border-radius: 999px; background: var(--event-tag-background); color: var(--event-tag-text); cursor: pointer; font: 500 0.72rem "Asap", sans-serif; }
.task-tag-editor__suggestion:hover:not(:disabled) { filter: brightness(0.97); }
.task-tag-editor__suggestion:disabled { cursor: default; opacity: 0.55; }
.task-tag-editor__chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border: 1px solid var(--event-tag-border); border-radius: 999px; background: var(--event-tag-background); color: var(--event-tag-text); font-size: 0.75rem; font-weight: 600; }
.task-tag-editor__chip button { display: grid; width: 16px; height: 16px; place-items: center; padding: 0; border: 0; border-radius: 50%; background: transparent; color: inherit; cursor: pointer; font-size: 1rem; line-height: 1; }
.task-tag-editor__chip button:disabled { cursor: default; opacity: 0.55; }
.task-tag-editor__add { display: flex; gap: 8px; }
.task-tag-editor__add input { flex: 1; min-width: 0; min-height: 38px; padding: 8px 10px; border: 1px solid var(--color-form-border); border-radius: 5px; background: var(--white); color: var(--gray-dark-5); font: 400 0.85rem "Asap", sans-serif; }
.task-tag-editor__add button { flex: 0 0 auto; }
@media (max-width: 520px) { .task-tag-editor__add { align-items: stretch; flex-direction: column; } }
</style>
