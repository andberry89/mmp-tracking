<template>
  <div class="task-item">
    <div>
      <HighPriorityIcon
        v-if="isHighPriority(doc)"
        v-tooltip="{ theme: 'info-tooltip', content: 'High Priority MMP' }"
      />
    </div>
    <div class="task-vehicle">
      <span class="vehicle">{{
        doc.vehicle.modelYear + " " + doc.vehicle.make + " " + doc.vehicle.model
      }}</span
      ><span class="segment">{{ doc.vehicle.segment }}</span>
    </div>
    <div :class="['task-deadline', isHighPriority(doc) ? 'due-soon' : '']">
      {{ doc.deadline }}
    </div>
    <div :class="['task-status', getStatus(doc.status)]">{{ doc.status }}</div>
    <div :class="getDateFormat(doc)">{{ getDateText(doc) }}</div>
    <div class="task-notes">
      <span>{{ docNotes }}</span>
      <Popper placement="top" disableClickAway arrow>
        <div class="expand-notes-container" @click="notesExpanded = !notesExpanded">
          <span v-if="doc.notes.length > 50" class="expand-notes"
            >see {{ notesExpanded ? "less" : "more" }}</span
          >
        </div>
        <template #content>
          <div class="full-notes">
            <p>{{ doc.notes }}</p>
          </div>
        </template>
      </Popper>
    </div>
    <div v-if="doc.assets.length > 0" class="task-assets active-assets zoom">
      <Popper placement="top" disableClickAway arrow>
        <div>
          <FolderIcon v-if="!assetsVisible" @click="toggleAssets" />
          <FolderOpenIcon v-if="assetsVisible" @click="toggleAssets" />
        </div>
        <template #content>
          <div class="assets-folder">
            <ul>
              <li v-for="(asset, idx) in doc.assets" :key="idx">
                <a :href="asset.url" target="_blank">
                  <span class="material-symbols-outlined open-in-new-icon"> open_in_new </span>
                  <span>{{ asset.notes }}</span></a
                >
              </li>
            </ul>
          </div>
        </template>
      </Popper>
    </div>
    <div v-else class="task-assets"><FolderIcon /></div>
    <div class="task-author">
      <span v-if="doc.author" :class="['initials', doc.author.team]">{{
        doc.author.initials
      }}</span>
      <span v-else class="assign-author zoom"
        ><AddCircleIcon v-tooltip="{ theme: 'info-tooltip', content: 'Assign an author' }"
      /></span>
    </div>
    <div class="task-actions"><MoreIcon class="more-icon" /></div>
  </div>
</template>
<script>
import {
  AddCircleIcon,
  FolderIcon,
  FolderOpenIcon,
  HighPriorityIcon,
  MoreIcon,
} from "@/assets/icons";
import { getDateFormat, getDateText, getStatus, isHighPriority } from "@/utils/task-item-utils";

export default {
  name: "TaskItem",
  data() {
    return {
      targetElement: null,
      assetsVisible: false,
      notesExpanded: false,
    };
  },
  props: {
    doc: {
      type: Object,
      required: true,
    },
  },
  computed: {
    docNotes() {
      if (this.doc.notes.length <= 50) {
        return this.doc.notes;
      } else {
        return this.doc.notes.slice(0, 35) + "...";
      }
    },
  },
  components: {
    AddCircleIcon,
    FolderIcon,
    FolderOpenIcon,
    HighPriorityIcon,
    MoreIcon,
  },
  methods: {
    getDateFormat: getDateFormat,
    getDateText: getDateText,
    getStatus: getStatus,
    isHighPriority: isHighPriority,
    toggleAssets(evt) {
      this.targetElement = evt.target;
      this.assetsVisible = !this.assetsVisible;
    },
  },
};
</script>
<style lang="scss" scoped>
:deep(.popper) {
  width: 25%;
}

.open-in-new-icon {
  color: var(--gray-dark-2);
  font-size: 16px;
  margin-right: 2px;
}

.task-item {
  background-color: var(--color-body-background);
  border: 2px solid var(--color-body-border);
  border-radius: 8px;
  transition: all 0.3s ease-in-out;

  .task-vehicle {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding-left: 10px;
    font-weight: bold;

    .vehicle {
      color: var(--color-body-text);
    }

    .segment {
      color: var(--color-body-text-secondary);
    }
  }

  .task-deadline {
    color: var(--color-body-text-secondary);
    font-weight: bold;
  }

  .due-soon,
  .embargo {
    color: var(--color-body-text-priority);
    font-weight: bold;
  }

  .published {
    color: var(--color-body-text);
  }

  .task-status {
    border-radius: 8px;
    padding: 5px 0;
    color: var(--color-body-text-status);
    font-weight: bold;
    font-size: 11px;
    width: 80%;
    text-align: center;

    &.pending {
      background-color: var(--color-body-pending);
    }

    &.rte {
      background-color: var(--color-body-rte);
    }

    &.rtp {
      background-color: var(--color-body-rtp);
    }

    &.scheduled {
      background-color: var(--color-body-scheduled);
    }

    &.updated {
      background-color: var(--color-body-updated);
    }
    &.published {
      background-color: var(--color-body-published);
    }
  }

  .task-notes {
    color: var(--color-body-text-tertiary);
    font-size: 11px;

    .expand-notes-container {
      display: inline;

      .expand-notes {
        color: var(--color-body-text-see-more);
        cursor: pointer;
        font-weight: bold;
      }
    }
  }

  .task-assets {
    .assets-folder {
      ul {
        list-style-type: none;
        padding: 0;
        margin: 0;

        li {
          margin-bottom: 3px;
          font-size: 16px;
          a {
            color: var(--color-body-link);
            text-decoration: none;
            transition: color 0.2s ease-in-out;
            &:hover {
              text-decoration: underline;
              color: var(--color-body-link-hover);
            }
          }
        }
      }
    }
  }

  .active-assets {
    cursor: pointer;
    svg {
      fill: var(--color-body-active-assets);
    }
  }

  .task-author {
    .initials {
      border-radius: 50%;
      color: var(--color-team-text);
      height: 24px;
      width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font: 700 14px/1.2 "Asap", sans-serif;

      &.freelance {
        background-color: var(--color-team-fl);
      }

      &.bg {
        background-color: var(--color-team-bg);
      }

      &.cd {
        background-color: var(--color-team-cd);
      }
    }

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

  &:hover {
    border-color: var(--black);
  }
}
</style>
