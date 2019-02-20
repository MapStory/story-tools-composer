const tour = {
  id: "StoryScapes-Tour",
  steps: [
        {
          title: "Edit Story Information",
          content: "First, give your StoryScape a title and description, and decide what category you think it falls into. This will help others discover your StoryScape from the Explore page once it is published.",
          target: "editStoryInfo",
          placement: "right",
        },
        {
          title: "Table of Contents",
          content: "StoryScapes can have one or multiple chapters. In the Table of Contents you’ll see your chapters listed. You can also click and drag your chapters to rearrange their order.",
          target: "tableOfContents",
          placement: "bottom",
          showPrevButton: true
        },
        {
          title: "Add New Chapter",
          content: "Each chapter contains a summary and StoryLayers, StoryPins and StoryFrames. To create a new chapter, click Add New Chapter. You’ll then see text boxes where you can give the chapter a title and summary. On the left-side you’ll see buttons where you can manage StoryLayers, StoryPins and StoryFrames for the chapter.",
          target: "manageChapters",
          placement: "bottom",
          showPrevButton: true
        },
        {
          title: "Manage Layers",
          content: "When you click into Manage StoryLayers, you will have the option to either add a StoryLayer to your chapter, or customize the basemap that you will use for your chapter. You can add as many StoryLayers to each chapter as you like, and apply a unique style to each individual StoryLayer. However, you can only use one basemap for the duration of your chapter.",
          target: "manageLayers",
          placement: "bottom",
          showPrevButton: true
        },
        {
          title: "Create StoryPins",
          content: "StoryPins allow you to add text, images or videos that help you better explain what is observed in the StoryLayer data. The StoryPin create form will ask you to define a start date, end date and location for your StoryPin, as well as the text, image or video that you’d like to appear with your StoryPin.",
          target: "createStorypins",
          placement: "bottom"
        },
        {
          title: "Create StoryFrames",
          content: "With StoryFrames you can define where the map is zoomed to at different points in time in your chapter. This helps to focus attention to areas where you feel the focus should be. Each chapter can have as many StoryFrames as you would like!",
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
          content: "As you are building your StoryScape, make sure to save frequently!",
          target: "saveStory",
          placement: "left",
          showPrevButton: true
        },
        {
          title: "Publish Your Story",
          content: "Once your StoryScape is finished, hit Publish. Now, your StoryScape will be discoverable from the Explore page, and from your user profile. You can always make changes to a published StoryScape and unpublish or delete it later.",
          target: "publishStory",
          placement: "left",
          showPrevButton: true
        }
      ]
};

document.addEventListener('click', function (event) {
  if (!event.target.matches('#tourComposer')) return;
  event.preventDefault();
	hopscotch.startTour(tour);
}, false);