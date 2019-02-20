/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */

import StoryMap from "./StoryMap";


function EditableStoryMap(data) {
  StoryMap.call(this, data);
}

EditableStoryMap.prototype = Object.create(StoryMap.prototype);
EditableStoryMap.prototype.constructor = EditableStoryMap;

EditableStoryMap.prototype.getState = function getState() {
  const config = {};
  config.map = {
    center: this.map_.getView().getCenter(),
    projection: this.map_
      .getView()
      .getProjection()
      .getCode(),
    zoom: this.map_.getView().getZoom(),
    layers: []
  };
  const mapId = this.get("id");
  if (mapId >= 0) {
    config.id = mapId;
  }
  const baseLayer = this.get("baselayer");
  if (baseLayer) {
    const baseLayerState = this.get("baselayer").get("state");
    baseLayerState.group = "background";
    baseLayerState.visibility = true;
    config.map.layers.push(baseLayerState);
  }
  this.storyLayers_.forEach((storyLayer) => {
    config.map.layers.push(storyLayer.getState());
  });
  return config;
};

EditableStoryMap.prototype.removeStoryLayer = function removeStoryLayer(storyLayer) {
  this.storyLayers_.remove(storyLayer);
  this.map_.removeLayer(storyLayer.getLayer());
};


export default EditableStoryMap;