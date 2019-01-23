

export function stStyleChoices() {
  return {
    symbolizers: [
      "circle", "square", "triangle", "star", "cross", "x"
    ],
    graphicColorTypes: [
      "Original Color", "Custom Color"
    ],
    rotationUnits: [
      "degrees", "radians"
    ],
    strokeStyle: [
      "solid", "dashed", "dotted"
    ],
    fontFamily: [
      "serif", "sans-serif", "monospace"
    ],
    colorRamps: [
      {
        0: "#ff0000",
        1: "#0000ff"
      },
      {
        0: "#00ff00",
        1: "#ffff00"
      }
    ],
    // @todo build these statically ahead of time using color-scheme-js
    colorPalettes: [
      {
        name: "colors 1",
        vals: ["#ff9900", "#b36b00", "#ffe6bf", "#ffcc80",
          "#00b366", "#007d48", "#bfffe4", "#80ffc9",
          "#400099", "#2d006b", "#dabfff", "#b580ff"]
      },
      {
        name: "colors 2",
        vals: ["#ff99aa", "#b36baa", "#aae6bf", "#aacc80",
          "#00b366", "#007d48", "#bfaae4", "#80aac9",
          "#40aa99", "#2daa6b", "#dabfaa", "#b580aa"]
      }
    ],
    classMethods: [
      "Natural Breaks",
      "Equal Interval",
      "Quantile",
      "Geometric Interval",
      "Standard Deviation"
    ],
    getPalette(name) {
      const found = this.colorPalettes.filter((p) => p.name === name);
      return found.length ? found[0] : null;
    }
  };
}

function RecentChoices(name, max) {
  this._max = max;
  this._key = `stRecentChoices-${  name}`;
  const saved = localStorage.getItem(this._key);
  this.recent = saved ? JSON.parse(saved) : [];
}

RecentChoices.prototype.clear = function() {
  this.recent = [];
  localStorage.setItem(this._key, JSON.stringify(this.recent));
};

RecentChoices.prototype.add = function(choice) {
  if (this.recent.indexOf(choice) === -1) {
    this.recent.push(choice);
    if (this.recent.length > this._max) {
      this.recent.shift();
    }
    localStorage.setItem(this._key, JSON.stringify(this.recent));
  }
};

export function stRecentChoices() {
  return {
    icons: new RecentChoices("icons", 24)
  };
}
