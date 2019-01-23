/* eslint no-underscore-dangle: 0 */
/* eslint func-names: 0 */
/* eslint no-plusplus: 0 */
/* eslint no-console: 0 */
/* eslint consistent-return: 0 */
/* eslint no-throw-literal: 0 */
/* eslint no-prototype-builtins: 0 */
/* eslint no-restricted-syntax: 0 */
/* eslint no-shadow: 0 */
/* eslint prefer-const: 0 */
/* eslint camelcase: 0 */
/* eslint prefer-rest-params: 0 */
/* eslint no-use-before-define: 0 */
/* eslint no-unused-vars: 0 */



let service_ = null;
let mediaHandlers_ = null;
let noembedProviders_ = null;

export function configuration($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    // Allow same origin resource loads.
    "self",
    new RegExp(/https?:\/\/.*\.flickr\.com\/photos\/.*/),
    new RegExp(/https?:\/\/flic\.kr\/p\/.*/),
    new RegExp(/https?:\/\/instagram\.com\/p\/.*/),
    new RegExp(/https?:\/\/instagr\.am\/p\/.*/),
    new RegExp(/https?:\/\/vine\.co\/v\/.*/),
    new RegExp(/https?:\/\/(?:www\.)?vimeo\.com\/.+/),
    new RegExp(/https?:\/\/((?:www\.)|(?:pic\.)?)twitter\.com\/.*/),
    new RegExp(/https?:\/\/(?:w{3}\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com).+/im),
    new RegExp(/https?:\/\/(w{3}\.)?soundcloud\.com\/.+/im),
    new RegExp(/https?:\/\/(?:((?:m)\.)|((?:www)\.)|((?:i)\.))?imgur\.com\/?.+/im)
  ]);
}

export function mediaService() {
  this.$get = function($rootScope, $http, $sce) {
    const http_ = $http;
    service_ = this;
    const sce_ = $sce;

    http_.jsonp($sce.trustAsResourceUrl("https://noembed.com/providers"), {
      jsonCallbackParam: "cb",
      headers: {
        "Content-Type": "application/json"
      }
    }).then((result) => {
      noembedProviders_ = result.data;
    });

    mediaHandlers_ = service_.configureDefaultHandlers();

    return service_;
  };

  this.isNOEmbedProvided = function(url) {
    for (let iProvider = 0; iProvider < noembedProviders_.length; iProvider += 1) {
      const provider = noembedProviders_[iProvider];
      for (let iUrlScheme = 0; iUrlScheme < provider.patterns.length; iUrlScheme += 1) {
        const regExp = new RegExp(provider.patterns[iUrlScheme], "i");
        if (url.match(regExp) !== null) {
          return true;
        }
      }
    }
    return false;
  };

  this.configureDefaultHandlers = function() {

    const defaultHandlers = [
      // {name: 'youtube', regex: /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*?[^\w\s-])/i, callback: embed_youtube},
      {name: "imgur", regex: /(https?:\/\/(\w+\.)?imgur\.com)/i, callback: embed_imgur}
    ];

    return defaultHandlers;
  };

  this.isUrl = function(str) {
    if (!/^(f|ht)tps?:\/\//i.test(str)) {
      return false;
    }
    return true;
  };

  this.getEmbedContent = function(url, embed_params) {

    const unsafeReturn = `<a href="${  url  }"> Unable to Embed Content </a>`;

    // Check to see if we have a specialized handler first for this site
    for (let iHandler = 0; iHandler < mediaHandlers_.length; iHandler += 1) {
      const testHandler = mediaHandlers_[iHandler];
      if (testHandler.regex.test(url)) {
        return testHandler.callback(url, embed_params);
      }
    }

    // Check and see if the embed content is handled through the noembed service
    if (service_.isNOEmbedProvided(url) !== null) {
      return noembed_handler(url, embed_params);
    }

    // Unable to embed allowed content. Return a link to content.
    return unsafeReturn;
  };

  // Handler callbacks
  function getNOEmbedRequestUrl(url, params) {
    let api_url = `https://noembed.com/embed?url=${  url}`,
      qs = "",
      i;

    for (i in params) {
      if (params[i] !== null) {
        qs += `&${  encodeURIComponent(i)  }=${  params[i]}`;
      }
    }

    api_url += qs;

    return api_url;
  }

  function noembed_handler(url, embed_params) {

    const request_url = getNOEmbedRequestUrl(url, embed_params);

    return http_.jsonp(sce_.trustAsResourceUrl(request_url), {
      jsonCallbackParam: "cb",
      headers: {
        "Content-Type": "application/json"
      }
    }).then(
      /* success */
      (result) => Promise.resolve(result.data.html),
      /* failure */
      (result) => {
        console.log("error", result);
      });

  }

  function embed_imgur(url, embed_params) {
    console.log("EMBEDDING IMGURE");
    const regex = /(https?:\/\/(\w+\.)?imgur\.com)/ig;

    const matches = url.match(regex);

    let embed = "";
    if (matches.length > 1) {
      // dealing with a basic image link from something like i.imgur.blah.png
      embed = `<iframe src="${  url  }" width="${  embed_params.maxwidth  }" height="${  embed_params.maxheight  }"></iframe>`;
    } else {
      // dealing with link to post or album
      const id_regex = /https?:\/\/imgur\.com\/(?:\w+)\/?(.*?)(?:[#\/].*|$)/i;
      embed = url.replace(id_regex,
        '<blockquote class="imgur-embed-pub" lang="en" data-id="a/$1"></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>');
    }

    return Promise.resolve(embed);
  }
}


const pins = storytools.core.maps.pins;
const stutils = storytools.core.time.utils;
let rootScope_ = null;

function StoryPinLayerManager($rootScope) {
  this.storyPins = [];
  this.map = null;
  rootScope_ = $rootScope;
}
StoryPinLayerManager.prototype.autoDisplayPins = function (range) {
  const pinsToCheck = this.storyPins.filter((pin) => pin.get("auto_show"));

  for (let iPin = 0; iPin < pinsToCheck.length; iPin += 1) {
    const pin = pinsToCheck[iPin];
    const pinRange = stutils.createRange(pin.start_time, pin.end_time);
    if (pinRange.intersects(range)) {
      rootScope_.$broadcast("showPin", pin);
    } else {
      rootScope_.$broadcast("hidePinOverlay", pin);
    }
  }
};
StoryPinLayerManager.prototype.pinsChanged = function(pins, action) {
  let i;
  if (action == "delete") {
    for (i = 0; i < pins.length; i++) {
      const pin = pins[i];
      for (let j = 0, jj = this.storyPins.length; j < jj; j++) {
        if (this.storyPins[j].id == pin.id) {
          this.storyPins.splice(j, 1);
          break;
        }
      }
    }
  } else if (action == "add") {
    for (i = 0; i < pins.length; i++) {
      this.storyPins.push(pins[i]);
    }
  } else if (action == "change") {
    // provided edits could be used to optimize below
  } else {
    throw new Error(`action? :${  action}`);
  }
  // @todo optimize by looking at changes
  const times = this.storyPins.map((p) => {
    if (p.start_time > p.end_time) {
      return storytools.core.utils.createRange(p.end_time, p.start_time);
    } 
    return storytools.core.utils.createRange(p.start_time, p.end_time);
    
  });
  this.map.storyPinsLayer.set("times", times);
  this.map.storyPinsLayer.set("features", this.storyPins);
};

StoryPinLayerManager.prototype.clear = function(){
  this.storyPins = [];
  this.map.storyPinsLayer.set("times", []);
  this.map.storyPinsLayer.set("features", this.storyPins);
};

StoryPinLayerManager.prototype.loadFromGeoJSON = function(geojson, projection, overwrite) {

  if (overwrite){
    this.storyPins = [];
  }

  if (geojson && geojson.features) {
    const loaded = pins.loadFromGeoJSON(geojson, projection);
    this.pinsChanged(loaded, "add", true);
  }
};


export {StoryPinLayerManager}
export const StoryPin = pins.StoryPin;


// @todo naive implementation on local storage for now
export function stAnnotationsStore(StoryPinLayerManager) {
  function path(mapid) {
    return `/maps/${  mapid  }/annotations`;
  }
  function get(mapid) {
    let saved = localStorage.getItem(path(mapid));
    saved = (saved === null) ? [] : JSON.parse(saved);
    // TODO is this still needed?
    /* saved.forEach(function(s) {
          s.the_geom = format.readGeometry(s.the_geom);
      }); */
    return saved;
  }
  function set(mapid, annotations) {
    // TODO is this still needed?
    /* annotations.forEach(function(s) {
          if (s.the_geom && !angular.isString(s.the_geom)) {
              s.the_geom = format.writeGeometry(s.the_geom);
          }
      }); */
    localStorage.setItem(path(mapid),
      new ol.format.GeoJSON().writeFeatures(annotations,
        {dataProjection: "EPSG:4326", featureProjection: "EPSG:3857"})
    );
  }
  return {
    loadAnnotations(mapid, projection) {
      return StoryPinLayerManager.loadFromGeoJSON(get(mapid), projection);
    },
    deleteAnnotations(annotations) {
      let saved = get();
      const toDelete = annotations.map((d) => d.id);
      saved = saved.filter((s) => toDelete.indexOf(s.id) < 0);
      set(saved);
    },
    saveAnnotations(mapid, annotations) {
      const saved = get();
      let maxId = 0;
      saved.forEach((s) => {
        maxId = Math.max(maxId, s.id);
      });
      const clones = [];
      annotations.forEach((a) => {
        if (typeof a.id === "undefined") {
          a.id = ++maxId;
        }
        const clone = a.clone();
        if (a.get("start_time") !== undefined) {
          clone.set("start_time", a.get("start_time")/1000);
        }
        if (a.get("end_time") !== undefined) {
          clone.set("end_time", a.get("end_time")/1000);
        }
        clones.push(clone);
      });
      set(mapid, clones);
    }
  };
}
