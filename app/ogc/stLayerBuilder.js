import StoryLayer from "./StoryLayer";


const stLayerBuilder = () => ({
  buildLayer(data) {
    const layer = new StoryLayer(data);
    layer.setWMSSource();
    return Promise.resolve(layer);
  }
});

export default stLayerBuilder;