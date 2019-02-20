import StoryLayer from "./StoryLayer";


function EditableStoryLayer(data) {
  StoryLayer.call(this, data);
}

EditableStoryLayer.prototype = Object.create(StoryLayer.prototype);
EditableStoryLayer.prototype.constructor = EditableStoryLayer;


export default EditableStoryLayer;