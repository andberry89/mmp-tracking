import dateFormat from "dateformat";

export const getDateFormat = (doc) => {
  if (doc.embargo && !doc.published) {
    return "embargo";
  } else if (doc.published) {
    return "published";
  } else {
    return "";
  }
};

export const getDateText = (doc) => {
  let date = "";
  if (doc.embargo && !doc.published) {
    if (doc.embargoDate !== "") {
      date =
        dateFormat(doc.embargoDate, "mediumDate") + " | " + dateFormat(doc.embargoDate, "h:MM TT");
    } else {
      date = doc.embargoNotes;
    }
  } else if (doc.published) {
    date = dateFormat(doc.publishedDate, "mediumDate");
  }
  return date;
};

export const getStatus = (status) => {
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
};

export const isHighPriority = (doc) => {
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
};
