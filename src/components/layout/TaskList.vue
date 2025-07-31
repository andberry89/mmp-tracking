<template>
  <div>
    <section class="content-column-headers grid">
      <div class="content-column-header">
        <span class="column-header-text"></span>
      </div>
      <div class="content-column-header">
        <span class="column-header-text">Vehicle/Segment</span>
      </div>
      <div class="content-column-header">
        <span class="column-header-text">Deadline</span>
      </div>
      <div class="content-column-header">
        <span class="column-header-text">Status</span>
      </div>
      <div class="content-column-header">
        <span class="column-header-text">Embargo/Publish Date</span>
      </div>
      <div class="content-column-header">
        <span class="column-header-text">Notes</span>
      </div>
      <div class="content-column-header">
        <span class="column-header-text">Assets</span>
      </div>
      <div class="content-column-header">
        <span class="column-header-text">Author</span>
      </div>
    </section>
    <section class="add-new">
      <PlusIcon class="add-new-btn" />
      <span>Add New Task</span>
    </section>
    <section class="task-list">
      <div class="task-item grid" v-for="(doc, idx) in documents" :key="idx">
        <div class="task-priority"><HighPriorityIcon v-if="isHighPriority(doc)" /></div>
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
        <div :class="['task-date', getDateFormat(doc)]">{{ getDateText(doc) }}</div>
        <div class="task-notes">{{ doc.notes }}</div>
        <div v-if="doc.assets.length > 0" class="task-assets active-assets zoom">
          <FolderIcon v-if="!isAssetsOpen" @click="toggleAssets(true)" />
          <FolderOpenIcon v-if="isAssetsOpen" @click="toggleAssets(false)" />
        </div>
        <div v-else class="task-assets"><FolderIcon /></div>
        <div class="task-author">
          <span v-if="doc.author" :class="['initials', doc.author.team]">{{
            doc.author.initials
          }}</span>
          <span v-else class="assign-author zoom"><AddCircleIcon /></span>
        </div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>
    </section>
  </div>
</template>
<script>
import dateFormat from "dateformat";
import {
  AddCircleIcon,
  FolderIcon,
  FolderOpenIcon,
  HighPriorityIcon,
  MoreIcon,
  PlusIcon,
} from "@/assets/icons";

export default {
  name: "TaskList",
  data() {
    return {
      isAssetsOpen: false,
    };
  },
  components: {
    AddCircleIcon,
    FolderIcon,
    FolderOpenIcon,
    HighPriorityIcon,
    MoreIcon,
    PlusIcon,
  },
  props: {
    documents: {
      type: Array,
      required: true,
    },
  },
  methods: {
    dateFormat: dateFormat,
    getDateFormat(doc) {
      if (doc.embargo && !doc.published) {
        return "embargo";
      } else if (doc.published) {
        return "published";
      } else {
        return "";
      }
    },
    getDateText(doc) {
      let date = "";
      if (doc.embargo && !doc.published) {
        if (doc.embargoDate !== "") {
          date =
            dateFormat(doc.embargoDate, "mediumDate") +
            " | " +
            dateFormat(doc.embargoDate, "h:MM TT");
        } else {
          date = doc.embargoNotes;
        }
      } else if (doc.published) {
        date = dateFormat(date, "mediumDate");
      }
      return date;
    },
    getStatus(status) {
      switch (status.toLowerCase()) {
        case "pending":
          return "pending";
        case "ready to edit":
          return "rte";
        case "ready to publish":
          return "rtp";
        case "scheduled":
          return "scheduled";
        case "published":
          return "published";
        case "updated":
          return "updated";
        default:
          return "";
      }
    },
    isHighPriority(doc) {
      if (doc.highPriority) {
        return true;
      } else if (doc.deadline && doc.deadline !== "") {
        let today = new Date();
        let tomorrow = new Date(today);
        let deadline = new Date(doc.deadline);
        tomorrow.setDate(today.getDate() + 1);
        let hp = false;

        if (deadline == today || deadline == tomorrow) {
          hp = true;
        }

        return hp;
      }
    },
    toggleAssets(value) {
      this.isAssetsOpen = value;
    },
  },
};
</script>
<style lang="scss" scoped>
@mixin column-layout() {
  display: grid;
  justify-items: start;
  align-items: center;
  grid-template-columns: 20px 1fr 100px 120px 175px 1fr 50px 50px 8px;
  // TODO: WORK ON SPACING FOR RESPONSIBE PURPOSES
  padding: 0 20px 0 4px;
}

.grid {
  @include column-layout();
}

.content-column-headers {
  margin-top: 20px;

  .content-column-header {
    text-align: center;
    padding: 10px 0;
    background-color: var(--color-header-background);
    border-radius: 4px;

    .column-header-text {
      font: 700 14px/1.2 "Asap", sans-serif;
      color: var(--color-body-column-header-text);
      display: block;
      width: 100%;
    }
  }
}

.add-new {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 5px;
  color: var(--color-add-new-item-text);
  font: 700 14px/1.2 "Asap", sans-serif;
  border: 2px dashed var(--color-add-new-item-border);
  cursor: pointer;
  margin-bottom: 5px;

  .add-new-btn {
    fill: var(--color-add-new);
    padding: 0;
    margin: 0;
    cursor: pointer;
  }
}

.task-list {
  font: 400 12px/1.2 "Asap", sans-serif;

  .task-item {
    background-color: var(--color-body-background);
    border: 2px solid var(--color-body-border);
    border-radius: 4px;
    padding-top: 8px;
    padding-bottom: 8px;
    transition: all 0.1s ease-in-out;

    .task-priority {
      margin: 0 auto;
    }

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
          transform: scale(1.4);
        }
      }
    }

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0px 15px 24px 6px rgba(0, 0, 0, 0.5);
      -webkit-box-shadow: 0px 15px 24px 6px rgba(0, 0, 0, 0.5);
      -moz-box-shadow: 0px 15px 24px 6px rgba(0, 0, 0, 0.5);
    }
  }
}
</style>
