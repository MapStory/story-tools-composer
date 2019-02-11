import { module } from "angular";
import featureinfobox from "./featureinfobox"
import stFeatureInfoService from "./services";
import {StoryMap,
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
} from "./module"

module("composer")
  .directive("featureinfobox", featureinfobox)
  .provider("stFeatureInfoService", stFeatureInfoService)
  .constant("StoryMap", StoryMap)
  .constant("EditableStoryMap", EditableStoryMap)
  .constant("StoryLayer", StoryLayer)
  .constant("EditableStoryLayer", EditableStoryLayer)
  .service("stAnnotateLayer", stAnnotateLayer)
  .service("stBaseLayerBuilder", stBaseLayerBuilder)
  .service("stEditableLayerBuilder", stEditableLayerBuilder)
  .service("stLayerBuilder", stLayerBuilder)
  .service("stStoryMapBaseBuilder", stStoryMapBaseBuilder)
  .service("stStoryMapBuilder", stStoryMapBuilder)
  .service("stEditableStoryMapBuilder", stEditableStoryMapBuilder);

