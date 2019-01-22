const Jsonix = require("imports-loader?require=>false!exports-loader?Jsonix!ogc-schemas/node_modules/jsonix/jsonix");

const mappings = {};
mappings.XLink_1_0 = require("w3c-schemas/lib/XLink_1_0.js").XLink_1_0;
mappings.Filter_1_0_0 = require("ogc-schemas/lib/Filter_1_0_0.js").Filter_1_0_0;
mappings.GML_2_1_2 = require("ogc-schemas/lib/GML_2_1_2.js").GML_2_1_2;
mappings.SLD_1_0_0 = require("ogc-schemas/lib/SLD_1_0_0.js").SLD_1_0_0;
mappings.OWS_1_1_0 = require("ogc-schemas/lib/OWS_1_1_0.js").OWS_1_1_0;
mappings.Filter_1_1_0 = require("ogc-schemas/lib/Filter_1_1_0.js").Filter_1_1_0;
mappings.OWS_1_0_0 = require("ogc-schemas/lib/OWS_1_0_0.js").OWS_1_0_0;
mappings.SMIL_2_0 = require("ogc-schemas/lib/SMIL_2_0.js").SMIL_2_0;
mappings.SMIL_2_0_Language = require("ogc-schemas/lib/SMIL_2_0_Language.js").SMIL_2_0_Language;
mappings.GML_3_1_1 = require("ogc-schemas/lib/GML_3_1_1.js").GML_3_1_1;
mappings.WFS_1_1_0 = require("ogc-schemas/lib/WFS_1_1_0.js").WFS_1_1_0;
mappings.WPS_1_0_0 = require("ogc-schemas/lib/WPS_1_0_0.js").WPS_1_0_0;
mappings.XSD_1_0 = require("w3c-schemas/lib/XSD_1_0.js").XSD_1_0;
mappings.WMSC_1_1_1 = require("ogc-schemas/lib/WMSC_1_1_1.js").WMSC_1_1_1;
mappings.WMS_1_3_0 = require("ogc-schemas/lib/WMS_1_3_0.js").WMS_1_3_0;
mappings.WMS_1_3_0_Exceptions = require("ogc-schemas/lib/WMS_1_3_0_Exceptions.js").WMS_1_3_0_Exceptions;

// modify the JSONIX mapping to add the GeoServer specific VendorOption
mappings.SLD_1_0_0.tis.push({
  ln: "VendorOption",
  ps: [{
    n: "name",
    an: {
      lp: "name"
    },
    t: "a"
  }, {
    n: "content",
    t: "v"
  }
  ]
});

for (let i=0, ii=mappings.SLD_1_0_0.tis.length; i<ii; i++) {
  if (mappings.SLD_1_0_0.tis[i].ln === "TextSymbolizer") {
    mappings.SLD_1_0_0.tis[i].ps.push({
      n: "vendorOption",
      en: "VendorOption",
      col: true,
      ti: ".VendorOption"
    });
  }
}
// end of modification

export {mappings, Jsonix};
