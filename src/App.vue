<template>
  <div class="layout-grid">
    <div id="logo" class="logo"></div>
    <header>
      <nav class="wrapper">
        <ul>
          <li>MMPs</li>
          <li>Makes</li>
          <li>Models</li>
          <li>Segments</li>
          <li>Authors</li>
        </ul>
      </nav>
    </header>
    <aside id="sidebar">
      <h3>Authors</h3>
      <div class="sidebar-wrapper">
        <div class="team">
          <h4>Buyer's Guide</h4>
          <div class="author">
            <span class="author-name">Joey Capparella</span>
          </div>
          <div class="author">
            <span class="author-name">Drew Dorian</span>
          </div>
          <div class="author">
            <span class="author-name">Austin Parsons</span>
            <span class="assigned">1 Assigned</span>
          </div>
          <div class="author">
            <span class="author-name">Andrew Wendler</span>
            <span class="assigned">1 Assigned</span>
          </div>
        </div>
        <div class="team">
          <h4>C/D Staff</h4>
          <div class="non-bg-team">
            <span class="view-text">View All</span>
            <span class="none-assigned">None Assigned</span>
          </div>
        </div>
        <div class="team">
          <h4>Freelancers</h4>
          <div class="non-bg-team">
            <span class="view-text">View Less</span>
          </div>
          <div class="author">
            <span class="author-name">David Gluckman</span>
            <span class="assigned">2 Assigned</span>
          </div>
          <div class="author">
            <span class="author-name">Beth Nichols</span>
          </div>
        </div>
      </div>
      <h3>Quick Stats</h3>
      <div class="sidebar-wrapper">
        <div class="stat-line">
          <span class="dot"></span>
          <span class="stat">Pending: </span><span class="stat-number">6</span>
        </div>
        <div class="stat-line">
          <span class="dot"></span>
          <span class="stat">Pending: </span><span class="stat-number">6</span>
        </div>
        <div class="stat-line">
          <span class="dot"></span>
          <span class="stat">Pending: </span><span class="stat-number">6</span>
        </div>
        <div class="stat-line">
          <span class="dot"></span>
          <span class="stat">Pending: </span><span class="stat-number">6</span>
        </div>
      </div>
      <h3>Published & Updates</h3>
      <!-- START HERE -->
      <!-- NEED TO MAKE SELECT COMPONENT -->
    </aside>
    <main id="content">
      <p>Main content goes here</p>
    </main>
  </div>
</template>
<script>
export default {
  name: "App",
};
</script>

<style lang="scss" scoped>
.layout-grid {
  display: grid;
  grid-template-columns: 140px 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "logo header"
    "sidebar content";
  height: 100vh;

  #logo {
    grid-area: logo;
    background-color: var(--color-background-logo);
    border-top-left-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 2rem;
  }

  header {
    grid-area: header;
    border-top-right-radius: 8px;
    display: flex;
    align-items: center;
    background-color: var(--color-background-header);
  }

  nav.wrapper {
    width: 100%;
    border-bottom: var(--color-border) solid 2px;
    padding: 3.5rem 20px;

    ul {
      display: flex;
      flex-flow: row nowrap;
      list-style-type: none;
      margin: 0;
      padding: 0;

      li {
        font: 700 2rem/1.2 "Monda", sans-serif;
        color: var(--color-header-text);
        margin-right: 2.5rem;
        cursor: pointer;

        &:hover {
          color: var(--color-header-text-hover);
        }
      }
    }
  }

  #sidebar {
    grid-area: sidebar;
    background-color: var(--color-background-sidebar);
    color: var(--color-sidebar-text);
    padding: 20px 10px;

    h3 {
      font-size: 12pt;
      font-weight: 700;
      color: var(--color-sidebar-text-header);
      text-transform: uppercase;
      margin-bottom: 15px;
    }

    .sidebar-wrapper {
      padding-left: 5px;
      font-family: "Asap", sans-serif;

      .team {
        margin-bottom: 16px;

        h4 {
          font-size: 11pt;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-sidebar-text);
        }

        .author {
          font-size: 10pt;
          line-height: 1;
          color: var(--color-sidebar-text);
          padding: 8px 0;
          display: flex;
          flex-flow: column nowrap;
          border-bottom: var(--color-sidebar-divider) solid 1px;

          &:last-child {
            border-bottom: none;
          }

          .assigned {
            color: var(--color-sidebar-text-subtext);
          }
        }

        .non-bg-team {
          font-size: 10pt;
          line-height: 1;
          color: var(--color-sidebar-text);
          display: flex;
          flex-flow: column nowrap;

          .view-text {
            cursor: pointer;
          }

          .none-assigned {
            margin-top: 10px;
            color: var(--color-sidebar-text-subtext);
          }
        }
      }

      .stat-line {
        font: 400 10pt/1.2 "Monda", sans-serif;
        color: var(--color-sidebar-text);
        padding: 6px 0;

        .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-body-pending);
          margin-right: 5px;
        }
        .stat {
          font-weight: 700;
        }

        &:last-child {
          margin-bottom: 30px;
        }
      }
    }
  }

  #content {
    grid-area: content;
    color: var(--color-text);
    padding: 1rem;
    background: url("@/assets/bg-pattern.jpeg") repeat;
    background-size: auto;
  }
}

// @media (min-width: 1024px) {
//   header {
//     display: flex;
//     place-items: center;
//     padding-right: calc(var(--section-gap) / 2);
//   }

//   .logo {
//     margin: 0 2rem 0 0;
//   }

//   header .wrapper {
//     display: flex;
//     place-items: flex-start;
//     flex-wrap: wrap;
//   }
// }
</style>
