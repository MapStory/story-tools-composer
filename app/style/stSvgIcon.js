/* eslint no-underscore-dangle: 0 */
/* eslint no-shadow: 0 */
/* eslint camelcase: 0 */

export default function stSvgIcon ($cacheFactory, $log) {
  const element = angular.element(document.createElement("div"));
  const imageCache = $cacheFactory("stSvgImage");
  const dataCache = $cacheFactory("stSvgData");
  function process(svg, fill, stroke) {
    element.html(svg);
    // @todo make smarter
    ["path", "polygon", "circle", "ellipse", "rect", "line", "polyline"].forEach((el) => {
      angular.forEach(element.find(el), (e) => {
        // @todo does it make sense to override stroke width?
        e = angular.element(e);
        const css = {
          opacity: 1
        };
        const existingFill = e.css("fill") || e.attr("fill") || "";
        if (existingFill !== "none" && existingFill !== "rgb(255, 255, 255)" && existingFill.toLowerCase() !== "#ffffff") {
          css.fill = fill;
        }
        const existingStroke = e.css("stroke") || e.attr("stroke");
        if (existingStroke !== "none") {
          css.stroke = stroke;
        }
        e.css(css);
      });
    });
    const root = element.find("svg");
    let width = parseInt(root.attr("width"), 10);
    let height = parseInt(root.attr("height"), 10);
    // ugh - we're totally guessing here but things go badly without:
    // on firefox: ns_error_not_available on calling canvas.drawimage
    // on chrome: very large icon (default size as it renders)
    // we might be able to set the src on an img element and figure this out...
    if (Number.isNaN(Number(width)) || Number.isNaN(Number(height))) {
      root.attr("width", 64);
      root.attr("height", 64);
      width = 64;
      height = 64;
    }
    const dataURI = `data:image/svg+xml;base64,${  btoa(element.html())}`;
    return {
      dataURI,
      width,
      height
    };
  }
  return {
    getImage(svgURI, fill, stroke, sync) {
      const key = svgURI + fill + stroke;
      const cached = imageCache.get(key);
      if (cached) {
        if (sync) {
          return cached;
        }
        return Promise.resolve(cached);
      } 
      if (sync) {
        const svg = dataCache.get(svgURI);
        if (svg) {
          const imageInfo = process(svg, fill, stroke);
          imageInfo.uri = svgURI;
          imageCache.put(key, imageInfo);
          return imageInfo;
        }
        $log.warning("no svg for", svgURI);
        return null;
      }
      return this.getImageData(svgURI).then((response) => {
        const imageInfo = process(response, fill, stroke);
        imageInfo.uri = svgURI;
        imageCache.put(key, imageInfo);
        return Promise.resolve(imageInfo);
      }, () => new Error("error"));
        
    },
    getImageData(svgURI) {
      return fetch(svgURI, {cache: "force-cache"}).then(rawResponse => {
        if (!rawResponse.ok) {
          return undefined;
        }
        return rawResponse.text().then(response => {
          dataCache.put(svgURI, response);
          return response;
        });
      }, (err) => {
      });
    }
  };
}
