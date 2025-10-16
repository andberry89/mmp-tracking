<template>
  <div v-if="assets.length > 0">
    <Popper placement="top" disableClickAway arrow>
      <div>
        <FolderIcon
          class="zoomable fill-[var(--color-body-active-assets)]"
          v-if="!assetsVisible"
          @click="toggleAssets"
        />
        <FolderOpenIcon
          class="zoomable fill-[var(--color-body-active-assets)]"
          v-else
          @click="toggleAssets"
        />
      </div>
      <template #content>
        <div>
          <ul class="popper-list">
            <li class="mb-3 text-base" v-for="(asset, idx) in assets" :key="idx">
              <a
                class="text-[var(--color-body-link)] no-underline transition-colors duration-200 ease-in-out hover:underline hover:text-[var(--color-body-link-hover)]"
                :href="asset.url"
                target="_blank"
              >
                <span
                  class="material-symbols-outlined mr-[2px] text-[var(--gray-dark-2)] align-middle leading-none"
                  style="font-size: 16px"
                >
                  open_in_new
                </span>
                <span>{{ asset.notes }}</span>
              </a>
            </li>
          </ul>
        </div>
      </template>
    </Popper>
  </div>
  <div v-else class="task-assets"><FolderIcon /></div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { FolderIcon, FolderOpenIcon } from "@/assets/icons";

// Props ------------------------------------
const props = defineProps<{
  assets: { url: string; notes: string }[];
}>();

// Reactive state ----------------------------
const targetElement = ref<null | EventTarget>(null);
const assetsVisible = ref(false);

// Methods --------------------------------
function toggleAssets(evt: MouseEvent) {
  targetElement.value = evt.target;
  assetsVisible.value = !assetsVisible.value;
}
</script>
