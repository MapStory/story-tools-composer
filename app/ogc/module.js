/* eslint no-underscore-dangle: 0 */
/* eslint camelcase: 0 */
import StoryLayer from "./StoryLayer";
import StoryMap from "./StoryMap";
import EditableStoryMap from "./EditableStoryMap";
import EditableStoryLayer from "./EditableStoryLayer";
import stAnnotateLayer from "./stAnnotateLayer";
import stBaseLayerBuilder from "./stBaseLayerBuilder";
import stEditableLayerBuilder from "./stEditableLayerBuilder";
import stEditableStoryMapBuilder from "./stEditableStoryMapBuilder";
import stStoryMapBaseBuilder from "./stStoryMapBaseBuilder";
import stStoryMapBuilder from "./stStoryMapBuilder";
import stLayerBuilder from "./stLayerBuilder";


$("#map .metric-scale-line").css("bottom", "-=40px");
$("#map .imperial-scale-line").css("bottom", "-=40px");
$("#map .nautical-scale-line").css("bottom", "-=40px");
$("#map .ol-mouse-position").css("bottom", "-=40px");
$("#switch-coords-border").css("bottom", "-=40px");

ol.Overlay.Popup = function overlayPopup(opt_options) {
  const options = opt_options || {};

  this.panMapIfOutOfView = options.panMapIfOutOfView;
  if (this.panMapIfOutOfView === undefined) {
    this.panMapIfOutOfView = true;
  }

  this.ani = options.ani;
  if (this.ani === undefined) {
    this.ani = ol.animation.pan;
  }

  this.ani_opts = options.ani_opts;
  if (this.ani_opts === undefined) {
    this.ani_opts = { duration: 250 };
  }

  this.container = document.createElement("div");
  this.container.className = "ol-popup";
  this.container.id = (options.id !== null && options.id !== undefined) ? options.id : "";

  this.closer = document.createElement("a");
  this.closer.className = "ol-popup-closer";
  this.closer.href = "#";
  this.container.appendChild(this.closer);

  const that = this;
  this.closer.addEventListener(
    "click",
    (evt) => {
      that.container.style.display = "none";
      that.closer.blur();
      evt.preventDefault();
    },
    false
  );

  this.content = document.createElement("div");
  this.content.className = "ol-popup-content";
  this.container.appendChild(this.content);

  ol.Overlay.call(this, {
    id: (options.id !== undefined && options.id !== null) ? options.id : "popup",
    element: this.container,
    positioning: (options.positioning !== null && options.positioning !== undefined) ? options.positioning : "top-left",
    stopEvent: (options.stopEvent !== null && options.stopEvent !== undefined) ? options.stopEvent : true,
    insertFirst: (options.insertFirst !== null && options.insertFirst !== undefined) ? options.insertFirst : true
  });
};

ol.inherits(ol.Overlay.Popup, ol.Overlay);

ol.Overlay.Popup.prototype.getId = function getId() {
  return this.container.id;
};

ol.Overlay.Popup.prototype.show = function popupShow(coord, html) {
  this.setPosition(coord);
  if (html instanceof HTMLElement) {
    this.content.innerHTML = "";
    this.content.appendChild(html);
  } else {
    this.content.innerHTML = html;
  }
  this.container.style.display = "block";
  if (this.panMapIfOutOfView) {
    this.panIntoView_(coord);
  }
  this.content.scrollTop = 0;
  return this;
};

/**
   * @private
   */
ol.Overlay.Popup.prototype.panIntoView_ = function popupPanIntoView(coord) {
  const popSize = {
      width: this.getElement().clientWidth + 20,
      height: this.getElement().clientHeight + 20
    },
    mapSize = this.getMap().getSize();

  const tailHeight = 20,
    tailOffsetLeft = 60,
    tailOffsetRight = popSize.width - tailOffsetLeft,
    popOffset = this.getOffset(),
    popPx = this.getMap().getPixelFromCoordinate(coord);

  const fromLeft = popPx[0] - tailOffsetLeft,
    fromRight = mapSize[0] - (popPx[0] + tailOffsetRight);

  const fromTop = popPx[1] - popSize.height + popOffset[1],
    fromBottom = mapSize[1] - (popPx[1] + tailHeight) - popOffset[1];

  const center = this.getMap()
      .getView()
      .getCenter(),
    curPx = this.getMap().getPixelFromCoordinate(center),
    newPx = curPx.slice();

  if (fromRight < 0) {
    newPx[0] -= fromRight;
  } else if (fromLeft < 0) {
    newPx[0] += fromLeft;
  }

  if (fromTop < 0) {
    newPx[1] += fromTop;
  } else if (fromBottom < 0) {
    newPx[1] -= fromBottom;
  }

  if (this.ani && this.ani_opts) {
    this.ani_opts.source = center;
    this.getMap().beforeRender(this.ani(this.ani_opts));
  }

  if (newPx[0] !== curPx[0] || newPx[1] !== curPx[1]) {
    this.getMap()
      .getView()
      .setCenter(this.getMap().getCoordinateFromPixel(newPx));
  }

  return this.getMap()
    .getView()
    .getCenter();
};

/**
   * Hide the popup.
   */
ol.Overlay.Popup.prototype.hide = function popupHide() {
  this.container.style.display = "none";
  return this;
};

/**
   * Indicates if the popup is in open state
   */
ol.Overlay.Popup.prototype.isOpened = function popupIsOpened() {
  return this.container.style.display === "block";
};


export {
  StoryMap,
  EditableStoryMap,
  StoryLayer,
  EditableStoryLayer,
  stAnnotateLayer,
  stBaseLayerBuilder,
  stEditableLayerBuilder,
  stLayerBuilder,
  stStoryMapBaseBuilder,
  stStoryMapBuilder,
  stEditableStoryMapBuilder
}
