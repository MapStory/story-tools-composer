/**
 * Creates a new Pin from data
 * @param data The data to build the pin from.
 */

const modelAttributes = [
  "title",
  "id",
  "_id",
  "content",
  "media",
  "startTime",
  "endTime",
  "inMap",
  "inTimeline",
  "pause_playback",
  "autoShow",
  "autoPlay",
  "playLength",
  "offset"
];

class Pin extends ol.Feature {
  constructor(data) {
    super();
    const copyData = { ...data };
    // Deletes and re-sets geometry
    delete data.geometry;
    ol.Feature.call(this, data);
    this.properties = data;
    this.setGeometry(new ol.geom.Point(copyData.geometry.coordinates));
    this.startTime = data.startTime ? new Date(data.startTime) : new Date();
    this.endTime = data.endTime ? new Date(data.endTime) : new Date();
    this.boxWidth = 300;
    this.boxHeight = 200;
  }
}

const addGetterAndSetterToPinPrototype = prop => {
  Object.defineProperty(Pin.prototype, prop, {
    get() {
      const val = this.get(prop);
      return typeof val === "undefined" ? null : val;
    },
    set(val) {
      this.set(prop, val);
    }
  });
};

const addMultipleGettersAndSettersToPinPrototype = props => {
  props.forEach(prop => {
    addGetterAndSetterToPinPrototype(prop);
  });
};

addMultipleGettersAndSettersToPinPrototype(modelAttributes);

export default Pin;
