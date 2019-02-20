// @todo - provisional default story pins style
const defaultStyle = [
  new ol.style.Style({
    fill: new ol.style.Fill({ color: "rgba(255, 0, 0, 0.1)" }),
    stroke: new ol.style.Stroke({ color: "red", width: 1 }),
    image: new ol.style.Circle({
      radius: 10,
      fill: new ol.style.Fill({ color: "rgba(255, 0, 0, 0.1)" }),
      stroke: new ol.style.Stroke({ color: "red", width: 1 })
    })
  })
];

export default defaultStyle;