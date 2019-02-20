
import { module } from "angular";
import styleService from "./styleService";
import {ol3MarkRenderer, ol3StyleConverter} from "./ol3StyleConverter";
import stSvgIcon from "./stSvgIcon";
import {loadOtherDirectives, attributeCombo, styleEditor, graphicEditor, classifyEditor, colorRamp, colorField, noClose, styleTypeEditor, rulesEditor} from "./directives";
import styleEditorController from "./styleEditorController";
import {iconCommons, iconCommonsSearch, iconCommonsController} from "./iconsCommons";
import stLayerClassifcationService from "./layerClassificationService"
import {stStyleChoices, stRecentChoices} from "./styleChoices";
import stStyleRuleBuilder from "./styleRuleBuilder";
import {stStyleTypes, injectionRun} from "./styleTypes";

const mod = module("composer");

mod
  .service("styleService", styleService)
  .factory("ol3MarkRenderer", ol3MarkRenderer)
  .factory("ol3StyleConverter", ol3StyleConverter)
  .factory("iconCommons", iconCommons)
  .factory("iconCommonsSearch", iconCommonsSearch)
  .factory("stSvgIcon", stSvgIcon)
  .factory("stLayerClassificationService", stLayerClassifcationService)
  .factory("stStyleChoices", stStyleChoices)
  .factory("stRecentChoices", stRecentChoices)
  .factory("stStyleRuleBuilder", stStyleRuleBuilder)
  .factory("stStyleTypes", stStyleTypes)
  .controller("styleEditorController", styleEditorController)
  .controller("iconCommonsController", iconCommonsController)
  .directive("attributeCombo", attributeCombo)
  .directive("styleEditor", styleEditor)
  .directive("graphicEditor", graphicEditor)
  .directive("classifyEditor", classifyEditor)
  .directive("colorRamp", colorRamp)
  .directive("colorField", colorField)
  .directive("noClose", noClose)
  .directive("styleTypeEditor", styleTypeEditor)
  .directive("rulesEditor", rulesEditor);

mod.run(injectionRun);
loadOtherDirectives(mod);
