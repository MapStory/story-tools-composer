export default class MinimalConfig {
  constructor(cfg) {
    return this.getMinimalCfg(cfg);
  }
  getMinimalCfg = cfg => {
    const chapters = [];
    for (let i = 0; i < cfg.chapters.length; i += 1) {
      chapters.push(this.getMinimalChapterCfg(cfg.chapters[i]));
    }
    return {
      storyID: cfg.storyID || "",
      chapters,
      about: cfg.about,
      isPublished: cfg.isPublished,
      removedChapters: cfg.removedChapters,
      removedFrames: cfg.removedFrames,
      removedPins: cfg.removedPins
    };
  };

  getMinimalPinCfg = storypin => ({
    geometry: {
      coordinates: storypin.coords,
      type: "Point"
    },
    id: storypin.get("id") || null,
    properties: {
      title: storypin.get("title") || "",
      content: storypin.get("content") || "",
      media: storypin.media || null,
      startTime: storypin.get("startTime"),
      endTime: storypin.get("endTime"),
      inTimeline: storypin.inTimeline || false,
      inMap: storypin.inMap || false,
      appearance: storypin.appearance || null,
      autoShow: storypin.autoShow || false,
      pausePlayback: storypin.pausePlayback || false,
      autoPlay: storypin.autoPlay || false,
      offset: storypin.offset || null,
      playLength: storypin.playLength || null
    },
    type: "Feature"
  });
  getMinimalChapterCfg = chapter => {
    const pins = this.getMinimalPinCfgArray(chapter.pins);
    return {
      id: chapter.id,
      index: chapter.id,
      mapId: chapter.mapId || 0,
      about: chapter.about,
      map: chapter.map,
      sources: chapter.sources,
      title: chapter.title,
      abstract: chapter.abstract,
      layers: chapter.layers,
      frames: this.getFrameArray(chapter.frames),
      viewerPlaybackMode: chapter.viewerPlaybackMode,
      removedPins: chapter.removedPins,
      pins
    };
  };
  // @TODO: add frame minimal config
  getFrameArray = frameObjects => {
    const frames = { features: [] };
    for (let i = 0; i < frameObjects.length; i += 1) {
      frames.features.push(frameObjects[i]);
    }
    return frames;
  };
  getMinimalPinCfgArray = pinObjects => {
    const pins = { features: [] };
    for (let i = 0; i < pinObjects.length; i += 1) {
      pins.features.push(this.getMinimalPinCfg(pinObjects[i]));
    }
    return pins;
  };
}
