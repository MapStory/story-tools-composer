
export default function stLocalStorageSvc() {
  function path(mapid) {
    return `/maps/${  mapid}`;
  }

  const localStorageHandler = {};

  localStorageHandler.get = function(mapid) {
    let saved = localStorage.getItem(path(mapid));
    saved = (saved === null) ? {} : angular.fromJson(saved);
    return saved;
  };

  localStorageHandler.set = function(mapConfig) {
    localStorage.setItem(path(mapConfig.id), angular.toJson(mapConfig));
  };

  localStorageHandler.list = function() {
    const maps = [];
    const pattern = new RegExp("/maps/(\\d+)$");
    Object.getOwnPropertyNames(localStorage).forEach((key) => {
      const match = pattern.exec(key);
      if (match) {
        // name/title eventually
        maps.push({
          id: match[1]
        });
      }
    });
    return maps;
  };

  localStorageHandler.nextId = function() {
    let lastId = 0;
    const existing = localStorageHandler.list().map((m) => m.id);
    existing.sort();
    if (existing.length) {
      lastId = parseInt(existing[existing.length - 1]);
    }
    return lastId + 1;
  };

  return {
    listMaps() {
      return localStorageHandler.list();
    },
    loadConfig(mapid) {
      return localStorageHandler.get(mapid);
    },
    saveConfig(mapConfig) {
      if (!angular.isDefined(mapConfig.id)) {
        mapConfig.id = localStorageHandler.nextId();
      }
      localStorageHandler.set(mapConfig);
    }
  };
}
