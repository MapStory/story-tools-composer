export default [
  {
    regex: new RegExp(/https?:\/\/.*\.flickr\.com\/photos\/.*/),
    isImage: true
  },
  { regex: new RegExp(/https?:\/\/flic\.kr\/p\/.*/), isImage: true },
  { regex: new RegExp(/https?:\/\/.*\.staticflickr\.com\/.*/), isImage: true },
  { regex: new RegExp(/https?:\/\/instagram\.com\/p\/.*/), isImage: true },
  { regex: new RegExp(/https?:\/\/instagr\.am\/p\/.*/), isImage: true },
  { regex: new RegExp(/https?:\/\/vine\.co\/v\/.*/), isImage: false },
  { regex: new RegExp(/https?:\/\/player\.vimeo\.com\/.*/), isImage: false },
  { regex: new RegExp(/https?:\/\/(?:www\.)?vimeo\.com\/.+/), isImage: false },
  {
    regex: new RegExp(/https?:\/\/((?:www\.)|(?:pic\.)?)twitter\.com\/.*/),
    isImage: true
  },
  {
    regex: new RegExp(/https?:\/\/(?:w{3}\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com).+/im),
    isImage: false
  },
  {
    regex: new RegExp(/https?:\/\/(w{3}\.)?soundcloud\.com\/.+/im),
    isImage: false
  },
  {
    regex: new RegExp(/https?:\/\/(?:((?:m)\.)|((?:www)\.)|((?:i)\.))?imgur\.com\/?.+/im),
    isImage: true
  },
  {
    regex: new RegExp(/https?:\/\/?ivideo.intelink\.gov\/.*/im),
    isImage: false
  },
  {
    regex: new RegExp(/https?:\/\/?gallery.intelink\.gov\/.*/),
    isImage: true
  },
  {
    regex: new RegExp(/https?:\/\/?ivideo.intelink.ic\.gov\/.*/im),
    isImage: false
  },
  {
    regex: new RegExp(/https?:\/\/?gallery.intelink.ic\.gov\/.*/),
    isImage: true
  },
  {
    regex: new RegExp(/https?:\/\/.*\.wikimedia\.org\/.*/),
    isImage: true
  },
  {
    regex: new RegExp(/https?:\/\/.*\.amazonaws\.com\/.*/),
    isImage: true
  }
];
