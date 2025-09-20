<template>
  <div
    class="task-item bg-[var(--color-body-background)] border-2 border-solid border-[var(--color-body-border)] rounded-lg transition-all duration-300 ease-in-out hover:border-black"
  >
    <div>
      <HighPriorityIcon
        v-if="isHighPriority(doc)"
        v-tooltip="{ theme: 'info-tooltip', content: 'High Priority MMP' }"
      />
    </div>

    <div class="task-vehicle flex flex-col items-start pl-2 font-bold">
      <span class="text-[var(--color-body-text)]">{{
        `${doc.vehicle.modelYear} ${doc.vehicle.make} ${doc.vehicle.model}`
      }}</span>
      <span class="text-[var(--color-body-text-secondary)]">{{ doc.vehicle.segment }}</span>
    </div>

    <div
      :class="[
        'font-bold',
        isHighPriority(doc)
          ? 'text-[var(--color-body-text-priority)]'
          : 'text-[var(--color-body-text-secondary)]',
      ]"
    >
      {{ doc.deadline }}
    </div>

    <div
      :class="[
        'rounded-lg px-2 py-1 text-xs text-center font-bold w-[90%]',
        getStatusClass(doc.status),
      ]"
    >
      {{ doc.status }}
    </div>

    <div :class="getDateFormat(doc)">{{ getDateText(doc) }}</div>

    <div class="text-[var(--color-body-text-tertiary)] text-[11px]">
      <span>{{ docNotes }}</span>
      <Popper placement="top" disableClickAway arrow>
        <div class="inline" @click="notesExpanded = !notesExpanded">
          <span
            v-if="doc.notes.length > 50"
            class="text-[var(--color-body-text-see-more)] cursor-pointer font-bold"
          >
            see {{ notesExpanded ? "less" : "more" }}
          </span>
        </div>
        <template #content>
          <div class="full-notes">
            <p>{{ doc.notes }}</p>
          </div>
        </template>
      </Popper>
    </div>

    <div v-if="doc.assets.length > 0" class="active-assets zoom">
      <Popper placement="top" disableClickAway arrow>
        <div>
          <FolderIcon v-if="!assetsVisible" @click="toggleAssets" />
          <FolderOpenIcon v-else @click="toggleAssets" />
        </div>
        <template #content>
          <div>
            <ul class="list-none p-0 m-0">
              <li class="mb-3 text-base" v-for="(asset, idx) in doc.assets" :key="idx">
                <a
                  class="text-[var(--color-body-link)] no-underline transition-colors duration-200 ease-in-out hover:underline hover:text-[var(--color-body-link-hover)]"
                  :href="asset.url"
                  target="_blank"
                >
                  <span class="material-symbols-outlined open-in-new-icon"> open_in_new </span>
                  <span>{{ asset.notes }}</span>
                </a>
              </li>
            </ul>
          </div>
        </template>
      </Popper>
    </div>
    <div v-else class="task-assets"><FolderIcon /></div>

    <div class="task-author">
      <span
        v-if="doc.author"
        :class="[
          'rounded-full h-6 w-6 flex items-center justify-center font-bold text-[14px] leading-[1.2] text-[var(--color-team-text)] font-[Asap,sans-serif]',
          getTeamColorClass(doc.author.team),
        ]"
        >{{ doc.author.initials }}</span
      >
      <span v-else class="assign-author zoom">
        <AddCircleIcon v-tooltip="{ theme: 'info-tooltip', content: 'Assign an author' }" />
      </span>
    </div>

    <div class="task-actions">
      <Popper placement="left" class="more-actions-popper" arrow>
        <MoreIcon class="more-icon" />
        <template #content>
          <div class="action-menu">
            <button
              @click="showModal = true"
              class="px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200"
            >
              Open Modal
            </button>
            <div class="menu-item">Duplicate Task</div>
            <div class="menu-item">Delete Task</div>
          </div>
        </template>
      </Popper>

      <ModalEditTask v-model="showModal" title="Edit Task" @close="showModal = false">
        <p>This is the modal content.</p>
      </ModalEditTask>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  AddCircleIcon,
  FolderIcon,
  FolderOpenIcon,
  HighPriorityIcon,
  MoreIcon,
} from "@/assets/icons";

import { getDateFormat, getDateText, getStatus, isHighPriority } from "@/utils/task-item-utils";
import { computed, ref } from "vue";
import { ModalsContainer } from "vue-final-modal";
import ModalEditTask from "@/components/common/ModalEditTask.vue";
import type { TaskDocument } from "@/types";

// Props
const props = defineProps<{
  doc: TaskDocument;
}>();

// Reactive state
const targetElement = ref<null | EventTarget>(null);
const assetsVisible = ref(false);
const notesExpanded = ref(false);
const showModal = ref(false);

// Computed
const docNotes = computed(() => {
  if (props.doc.notes.length <= 50) {
    return props.doc.notes;
  } else {
    return props.doc.notes.slice(0, 35) + "...";
  }
});

const statusClassMap = {
  pending: "bg-yellow-200 text-yellow-900",
  rte: "bg-blue-100 text-blue-900",
  rtp: "bg-purple-200 text-purple-900",
  scheduled: "bg-orange-200 text-orange-900",
  updated: "bg-indigo-200 text-indigo-900",
  published: "bg-green-200 text-green-900",
};

const teamColorMap = {
  freelance: " bg-pink-500",
  bg: "bg-indigo-600",
  cd: "bg-teal-400",
};

const getStatusClass = (status: string) => {
  const normalized = getStatus(status);
  return statusClassMap[normalized] || "bg-gray-200 text-gray-800";
};

const getTeamColorClass = (team: string) => {
  const normalized = teamColorMap[team];
  return normalized + " text-white";
};

// Methods
function toggleAssets(evt: MouseEvent) {
  targetElement.value = evt.target;
  assetsVisible.value = !assetsVisible.value;
}
</script>
<style lang="scss" scoped>
:deep(.popper) {
  width: auto;
  max-width: 25%;
}

.open-in-new-icon {
  color: var(--gray-dark-2);
  font-size: 16px;
  margin-right: 2px;
}

.task-item {
  .embargo {
    color: var(--color-body-text-priority);
    font-weight: bold;
  }

  .published {
    color: var(--color-body-text);
  }

  .active-assets {
    svg {
      fill: var(--color-body-active-assets);
    }
  }

  .task-author {
    .assign-author {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .task-actions {
    .more-icon {
      fill: var(--color-body-more-icon);
      cursor: pointer;
    }
  }

  .zoom {
    svg {
      cursor: pointer;
      transition: transform 0.2s ease-in-out;
      &:hover {
        transform: scale(1.2);
      }
    }
  }
}
</style>
