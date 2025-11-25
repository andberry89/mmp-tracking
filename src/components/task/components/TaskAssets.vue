<template>
  <div>
    <Popper placement="top" disableClickAway arrow>
      <div>
        <FolderIcon
          :class="['zoomable', hasAssets ? 'fill-[var(--color-body-active-assets)]' : '']"
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
          <transition-group name="asset" tag="ul" class="popper-list mb-4">
            <li
              class="mb-3 text-base flex justify-between items-center"
              v-for="(asset, idx) in assets"
              :key="idx"
            >
              <a
                class="flex-1 text-[var(--color-body-link)] no-underline transition-colors duration-200 ease-in-out hover:underline hover:text-[var(--color-body-link-hover)]"
                :href="asset.url"
                target="_blank"
              >
                <span
                  class="material-symbols-outlined mr-[2px] text-[var(--gray-dark-2)] align-middle leading-none"
                  style="font-size: 16px"
                >
                  open_in_new
                </span>
                {{ asset.notes }}
              </a>
              <button
                @click="removeAsset(idx)"
                class="ml-2 text-red-500 hover:text-red-700 hover:cursor-pointer"
                title="Delete Asset"
              >
                x
              </button>
            </li>
          </transition-group>
          <div class="border-t pt-3">
            <h2 class="text-center text-sm mb-2">Add New Asset</h2>
            <div class="mb-2">
              <label class="block text-xs mb-1">Label</label>
              <input
                v-model="newNotes"
                class="w-full px-2 py-1 border rounded text-sm"
                placeholder="e.g. Press Release"
              />
            </div>
            <div class="mb-3">
              <label class="block text-xs mb-1">URL</label>
              <input
                v-model="newUrl"
                class="w-full px-2 py-1 border rounded text-sm"
                :class="{
                  'border-red-500': newUrl && !isValidUrl(newUrl),
                  'border-gray-300': !newUrl || isValidUrl(newUrl),
                }"
                placeholder="https://..."
              />
              <p v-if="newUrl && !isValidUrl(newUrl)" class="text-xs text-red-500 mt-1">
                Enter a valid URL (must begin with http:// or https://)
              </p>
            </div>

            <button
              @click="addAsset"
              class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 hover:cursor-pointer w-full"
            >
              Add Asset
            </button>
          </div>
        </div>
      </template>
    </Popper>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { FolderIcon, FolderOpenIcon } from "@/assets/icons";

// Props & Emits ----------------------------
const props = defineProps<{
  assets: { url: string; notes: string }[];
}>();

const emit = defineEmits<{
  (e: "delete-asset", index: number): void;
  (e: "add-asset", asset: { url: string; notes: string }): void;
}>();

// Reactive state ----------------------------
const targetElement = ref<null | EventTarget>(null);
const assetsVisible = ref(false);
const newNotes = ref("");
const newUrl = ref("");

// Computed -------------------------------
const hasAssets = computed(() => props.assets.length > 0);

// Methods --------------------------------
function toggleAssets(evt: MouseEvent) {
  targetElement.value = evt.target;
  assetsVisible.value = !assetsVisible.value;
}

function removeAsset(idx: number) {
  emit("delete-asset", idx);
}

function addAsset() {
  const notes = newNotes.value.trim();
  const url = newUrl.value.trim();

  if (!notes) {
    alert("Please enter a label for the asset.");
    return;
  }

  if (!isValidUrl(url)) {
    alert("Please enter a valid URL.");
    return;
  }

  emit("add-asset", { url: newUrl.value.trim(), notes: newNotes.value.trim() });

  newNotes.value = "";
  newUrl.value = "";
}

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
</script>
