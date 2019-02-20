const tour = {
  id: "StoryScapes-Tour",
  steps: [
      {
      title: "Welcome to StoryScapes Composer",
      content: "StoryScapes Composer allows you to create stories using geospatial and temporal data...",
      target: "editStoryInfo",
      placement: "right"
      },
      {
          title: "Edit Story Information",
          content: "Click Edit Story Info to edit the title, summary and category for your story.",
          target: "editStoryInfo",
          placement: "right",
        },
        {
          title: "Table of Contents",
          content: "Add and delete chapters",
          target: "tableOfContents",
          placement: "bottom",
          showPrevButton: true
        },
        {
          title: "Manage Chapters",
          content: "Edit your chapter's title and summary.",
          target: "manageChapters",
          placement: "bottom",
          showPrevButton: true
        },
        {
          title: "Manage Layers",
          content: "Add a StoryLayer. Style your StoryLayer. Select a basemap.",
          target: "manageLayers",
          placement: "bottom",
          showPrevButton: true
        },
        {
          title: "Create StoryPins",
          content: "StoryPins allow you to drop a pin at a geographic location at a particular time to denote significance. You may further illustrate the point in time by embedding images and video.",
          target: "createStorypins",
          placement: "bottom"
        },
        {
          title: "Create StoryFrames",
          content: "StoryFrames allow you to select a geographic location to focus on at a specified time during your story.",
          target: "createStoryframes",
          placement: "bottom",
          showPrevButton: true
        },
        {
          title: "Preview Mode",
          content: "Toggle preview mode to view how your story will look when it is published.",
          target: "previewMode",
          placement: "bottom",
          showPrevButton: true
        },
        {
          title: "Save Your Story",
          content: "Save the status of your story.",
          target: "saveStory",
          placement: "left",
          showPrevButton: true
        },
        {
          title: "Publish Your Story",
          content: "Publish your story.",
          target: "publishStory",
          placement: "left",
          showPrevButton: true
        }
      ]
};

document.addEventListener('click', function (event) {
  if (!event.target.matches('#tourComposer')) return;
  event.preventDefault();

  console.log('click: ', event);

	hopscotch.startTour(tour);
}, false);