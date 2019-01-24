export default function StyleComplete() {
  return {
    isComplete(style) {
      if (style === undefined) {
        return false;
      }

      if (style.classify) {
        if (style.classify.method === "unique") {
          if (style.classify.attribute === null || style.classify.maxClasses === null || !style.classify.colorPalette) {
            return false;
          }
        } else if (style.classify.method === null || style.classify.attribute === null || style.classify.colorRamp === null || style.rules.length === 0) {
          return false;
        }
      }
      return true;
    }
  };
};
