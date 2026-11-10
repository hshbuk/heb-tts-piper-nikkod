let currentAudio = null;

// יצירת פריטי תפריט קליק ימני בעת התקנה או טעינת התוסף
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "read-selected-text",
    title: "הקרא טקסט מסומן (TTS מקומי)",
    contexts: ["selection"]
  });

  browser.contextMenus.create({
    id: "stop-tts-audio",
    title: "עצור הקראה",
    contexts: ["all"]
  });
});

// טיפול בלחיצה על תפריט ההקשר
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  // אפשרות עצירת השמע
  if (info.menuItemId === "stop-tts-audio") {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    return;
  }

  // הקראת הטקסט המסומן
  if (info.menuItemId === "read-selected-text" && info.selectionText) {
    const textToSpeak = info.selectionText.trim();
    if (!textToSpeak) return;

    // עצירת שמע קודם אם עודנו פעיל
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }

    try {
      console.log("שולח טקסט לשרת:", textToSpeak);

      const response = await fetch("http://127.0.0.1:5000/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify({ text: textToSpeak })
      });

      if (!response.ok) {
        throw new Error(`שגיאת שרת: ${response.status}`);
      }

      // קבלת קובץ ה-WAV והשמעתו ישירות ברקע
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      currentAudio = new Audio(audioUrl);

      currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
      };

      currentAudio.onerror = (e) => {
        console.error("שגיאה בניגון שמע:", e);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
      };

      await currentAudio.play();
      console.log("השמע מתנגן בהצלחה!");
    } catch (error) {
      console.error("[TTS Extension Error]:", error);
    }
  }
});