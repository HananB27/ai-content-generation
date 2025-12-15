const progressStore = new Map();

function setProgress(contentId, message, percent = null, metadata = {}) {
  progressStore.set(contentId, {
    message,
    percent,
    timestamp: Date.now(),
    ...metadata
  });
}

function getProgress(contentId) {
  return progressStore.get(contentId) || { message: 'Starting...', percent: 0 };
}

function clearProgress(contentId) {
  progressStore.delete(contentId);
}

module.exports = {
  setProgress,
  getProgress,
  clearProgress
};
