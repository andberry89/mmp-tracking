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
        <div class="task-priority"><HighPriorityIcon v-if="doc.highPriority" /></div>
        <div class="task-vehicle">
          <span class="vehicle">{{
            doc.vehicle.modelYear + " " + doc.vehicle.make + " " + doc.vehicle.model
          }}</span
          ><span class="segment">{{ doc.vehicle.segment }}</span>
        </div>
        <div class="task-deadline">{{ doc.deadline }}</div>
        <div class="task-status pending">{{ doc.status }}</div>
        <div class="task-date">NEED LOGIC HERE</div>
        <div class="task-notes">{{ doc.notes }}</div>
        <div class="task-assets"><FolderIcon /></div>
        <div class="task-author">
          <span class="initials freelance">{{ doc.author ? doc.author.initials : "NA" }}</span>
        </div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>

      <div class="task-item grid">
        <div class="task-priority"></div>
        <div class="task-vehicle">
          <span class="vehicle">2026 Audi A3</span
          ><span class="segment">Subcompact Luxury Cars</span>
        </div>
        <div class="task-deadline"></div>
        <div class="task-status pending">Pending</div>
        <div class="task-date"></div>
        <div class="task-notes">no changes expected</div>
        <div class="task-assets"><FolderIcon /></div>
        <div class="task-author"><span class="initials freelance">DG</span></div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>
      <div class="task-item grid">
        <div class="task-priority"></div>
        <div class="task-vehicle">
          <span class="vehicle">2026 Ferrari Roma Spider</span
          ><span class="segment">Ultimate Luxury Sports Cars</span>
        </div>
        <div class="task-deadline"></div>
        <div class="task-status pending">Pending</div>
        <div class="task-date"></div>
        <div class="task-notes">
          Spider only, 2026 is final model year, replaced by Amalfi for 2027
        </div>
        <div class="task-assets"><FolderIcon /></div>
        <div class="task-author">
          <span class="initials"><AddCircleIcon /></span>
        </div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>
      <div class="task-item grid">
        <div class="task-priority"></div>
        <div class="task-vehicle">
          <span class="vehicle">2026 Hyundai Elantra</span><span class="segment">Compact Cars</span>
        </div>
        <div class="task-deadline"></div>
        <div class="task-status pending">Pending</div>
        <div class="task-date embargo">Mid-July TBD</div>
        <div class="task-notes">check 2026 What's New Folder</div>
        <div class="task-assets"><FolderIcon /></div>
        <div class="task-author">
          <span class="initials"><AddCircleIcon /></span>
        </div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>
      <div class="task-item grid">
        <div class="task-priority"><HighPriorityIcon /></div>
        <div class="task-vehicle">
          <span class="vehicle">2026 Rivian R1T</span
          ><span class="segment">Electric Pickup Trucks</span>
        </div>
        <div class="task-deadline due-soon">July 7, 2025</div>
        <div class="task-status pending">Pending</div>
        <div class="task-date embargo">July 8, 2025<br />10:00 AM EST</div>
        <div class="task-notes"></div>
        <div class="task-assets active-assets"><FolderIcon /></div>
        <div class="task-author">
          <span class="initials bg">AP</span>
        </div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>
      <div class="task-item grid">
        <div class="task-priority"></div>
        <div class="task-vehicle">
          <span class="vehicle">2026 Volvo V60 Cross Country</span
          ><span class="segment">Station Wagons</span>
        </div>
        <div class="task-deadline">July 17, 2025</div>
        <div class="task-status rte">Ready to Edit</div>
        <div class="task-date"></div>
        <div class="task-notes">Joey reading</div>
        <div class="task-assets active-assets"><FolderIcon /></div>
        <div class="task-author">
          <span class="initials bg">DD</span>
        </div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>
      <div class="task-item grid">
        <div class="task-priority"></div>
        <div class="task-vehicle">
          <span class="vehicle">2026 Mazda CX-5</span><span class="segment">Compact SUVs</span>
        </div>
        <div class="task-deadline">July 9, 2025</div>
        <div class="task-status rte">Ready to Edit</div>
        <div class="task-date embargo">July 10, 2025<br />04:00 AM EST</div>
        <div class="task-notes"></div>
        <div class="task-assets active-assets"><FolderIcon /></div>
        <div class="task-author">
          <span class="initials bg">AW</span>
        </div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>
      <div class="task-item grid">
        <div class="task-priority"></div>
        <div class="task-vehicle">
          <span class="vehicle">2026 Mercedes-AMG E53</span>
          <span class="segment">Premium Sports Sedans</span>
        </div>
        <div class="task-deadline"></div>
        <div class="task-status rtp">Ready to Publish</div>
        <div class="task-date embargo"></div>
        <div class="task-notes"></div>
        <div class="task-assets active-assets"><FolderIcon /></div>
        <div class="task-author">
          <span class="initials bg">AP</span>
        </div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>
      <div class="task-item grid">
        <div class="task-priority"></div>
        <div class="task-vehicle">
          <span class="vehicle">2026 Rivian R1S</span>
          <span class="segment">Electric Mid-size Luxury SUVs</span>
        </div>
        <div class="task-deadline"></div>
        <div class="task-status scheduled">Scheduled</div>
        <div class="task-date embargo">July 8, 2025<br />10:00 AM EST</div>
        <div class="task-notes">Scheduled for embargo time</div>
        <div class="task-assets"></div>
        <div class="task-author">
          <span class="initials bg">AW</span>
        </div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>
      <div class="task-item grid">
        <div class="task-priority"></div>
        <div class="task-vehicle">
          <span class="vehicle">2026 Dodge Durango</span>
          <span class="segment">Mid-size Three-row SUVs</span>
        </div>
        <div class="task-deadline"></div>
        <div class="task-status published">Published</div>
        <div class="task-date">July 7, 2025</div>
        <div class="task-notes"></div>
        <div class="task-assets"></div>
        <div class="task-author">
          <span class="initials freelance">BN</span>
        </div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>
      <div class="task-item grid">
        <div class="task-priority"></div>
        <div class="task-vehicle">
          <span class="vehicle">2026 Acura TLX</span>
          <span class="segment">Compact Luxury Cars</span>
        </div>
        <div class="task-deadline"></div>
        <div class="task-status published">Published</div>
        <div class="task-date">July 1, 2025</div>
        <div class="task-notes"></div>
        <div class="task-assets"></div>
        <div class="task-author">
          <span class="initials cd">JL</span>
        </div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>
      <div class="task-item grid">
        <div class="task-priority"></div>
        <div class="task-vehicle">
          <span class="vehicle">2026 GMC Yukon</span>
          <span class="segment">Full-size SUVs</span>
        </div>
        <div class="task-deadline"></div>
        <div class="task-status updated">Updated</div>
        <div class="task-date">July 1, 2025</div>
        <div class="task-notes"></div>
        <div class="task-assets"></div>
        <div class="task-author">
          <span class="initials freelance">DG</span>
        </div>
        <div class="task-actions"><MoreIcon class="more-icon" /></div>
      </div>
    </section>
  </div>
</template>
<script>
import {
  AddCircleIcon,
  FolderIcon,
  // FolderOpenIcon,
  HighPriorityIcon,
  MoreIcon,
  PlusIcon,
} from "@/assets/icons";

export default {
  name: "TaskList",
  components: {
    AddCircleIcon,
    FolderIcon,
    // FolderOpenIcon,
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
  border: 1px dashed var(--color-add-new-item-border);
  cursor: pointer;

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
    }

    .task-actions {
      .more-icon {
        fill: var(--color-body-more-icon);
        cursor: pointer;
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
