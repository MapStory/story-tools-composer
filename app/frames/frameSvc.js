import moment from "moment";
import PubSub from "pubsub-js";

function frameSvc(stateSvc) {
  const svc = {};

  PubSub.subscribe("updateStoryframes", (event, chapters) => {
    stateSvc.config.storyframes = [[]];
    for (let c = 0; c < chapters.length; c++) {
      for (let f = 0; f < chapters[c].storyframes.length; f++) {
        const coords = JSON.parse(chapters[0].storyframes[f].center);
        stateSvc.config.storyframes.push({
          title: chapters[c].storyframes[f].title,
          startDate: moment
            .unix(chapters[c].storyframes[f].start_time)
            .format("YYYY-MM-DD"),
          endDate: moment
            .unix(chapters[c].storyframes[f].end_time)
            .format("YYYY-MM-DD"),
          bb1: [coords[0][0], coords[0][1]],
          bb2: [coords[1][0], coords[1][1]],
          bb3: [coords[2][0], coords[2][1]],
          bb4: [coords[3][0], coords[3][1]]
        });
      }
    }
    svc.storyFrames = stateSvc.config.storyframes;
  });
  svc.get = prop => svc[prop];
  return svc;
}

export default frameSvc;
