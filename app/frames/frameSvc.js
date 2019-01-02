import moment from "moment";
import PubSub from "pubsub-js";
import functional from "app/utils/functional";

function frameSvc(stateSvc) {
  let frameSettings = null;
  let currentFrameIndex = 0;
  const svc = {
    storyFrames: null,
    getCurrentFrame: date => {
      const index = svc.getCurrentFrameIndex();
      const frame = svc
        .getFrameSettings()
        .filter(f => f.chapter === stateSvc.getChapterIndex())[index];
      if (frame)
        return {
          start: frame.startDate,
          end: frame.endDate
        };
      return false;
    },

    getCurrentFrameIndex: () => currentFrameIndex,

    getNextFrameIndex: () => {
      const current = svc.getCurrentFrameIndex();
      const frameSettingsLength = svc.getFrameSettings().length;
      if (current < frameSettingsLength) return current + 1;
      return 0;
    },

    incrementFrameIndex: () =>
      functional.pipe(svc.getNextFrameIndex, svc.setCurrentFrameIndex),

    setCurrentFrameIndex: int => {
      currentFrameIndex = int;
      return true;
    },

    setFrameSettings: settings => {
      frameSettings = settings;
      return true;
    },

    getFrameSettings: () => frameSettings || false,

    setFrames: frames => {
      svc.frames = frames;
    },

    pushFramesToStateSvc: chapters => {
      stateSvc.config.storyframes = [];
      for (let c = 0; c < chapters.length; c++) {
        for (let f = 0; f < chapters[c].storyframes.length; f++) {
          const coords = JSON.parse(chapters[c].storyframes[f].center);

          stateSvc.config.storyframes.push({
            title: chapters[c].storyframes[f].title,
            id: chapters[c].storyframes[f].id,
            chapter: c,
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
      svc.setFrames(stateSvc.config.storyframes);
    },
    updateStoryFrames: () => {
      let fetchedFrameSettings = svc.get("storyFrames");

      if (fetchedFrameSettings) {
        fetchedFrameSettings = fetchedFrameSettings.filter(
          f => f.chapter === stateSvc.getChapterIndex()
        );
      }
      const fetchedFrames = [];

      for (let i = 0; i < fetchedFrameSettings.length; i++) {
        if (
          fetchedFrameSettings[i].startDate &&
          fetchedFrameSettings[i].endDate
        ) {
          fetchedFrames[i] = {
            id: fetchedFrameSettings[i].id,
            chapter: fetchedFrameSettings[i].chapter,
            title: fetchedFrameSettings[i].title,
            startDate: new Date(fetchedFrameSettings[i].startDate),
            startTime: fetchedFrameSettings[i].startTime,
            endDate: new Date(fetchedFrameSettings[i].endDate),
            endTime: fetchedFrameSettings[i].endTime,
            bb1: [
              fetchedFrameSettings[i].bb1[0],
              fetchedFrameSettings[i].bb1[1]
            ],
            bb2: [
              fetchedFrameSettings[i].bb2[0],
              fetchedFrameSettings[i].bb2[1]
            ],
            bb3: [
              fetchedFrameSettings[i].bb3[0],
              fetchedFrameSettings[i].bb3[1]
            ],
            bb4: [
              fetchedFrameSettings[i].bb4[0],
              fetchedFrameSettings[i].bb4[1]
            ]
          };
        }
      }
      svc.setFrameSettings({ ...fetchedFrames });
    }
  };

  PubSub.subscribe("updateStoryframes", (event, chapters) => {
    svc.pushFramesToStateSvc(chapters);
  });

  svc.get = prop => svc[prop];
  return svc;
}

export default frameSvc;
