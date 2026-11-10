(() => {
  if (window.__local_tts_initialized) return;
  window.__local_tts_initialized = true;

  let currentAudio = null;

  browser.runtime.onMessage.addListener((message) => {
    if (message.action === "stop") {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
      }
      return;
    }

    if (message.action === "play" && message.audioData) {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      currentAudio = new Audio(message.audioData);
      currentAudio.play().catch((err) => {
        console.error("שגיאה בניגון שמע בדף:", err);
      });
    }
  });
})();