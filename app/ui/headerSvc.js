import utils from "app/utils/utils";

export default {
  updateSaveStatus: status => {
    const $saveConfirmationDiv = $("#save-confirmation");
    const timestamp = utils.getReadableTimestamp();
    if (status === "saving") {
      $saveConfirmationDiv.text(`Saving...`);
    } else if (status === "saved") {
      $saveConfirmationDiv.text(`Last synced: ${timestamp}`);
    } else if (status === "failed") {
      $saveConfirmationDiv.text(`Saving failed. Please try again later.`);
    }
    return timestamp;
  }
};
