const TTS_ENDPOINT = "http://127.0.0.1:5000/tts";

let currentAudio = null;
let currentAudioUrl = null;
let abortController = null;
let playbackQueue = [];
let isPlaying = false;
let isPaused = false;
let sessionToken = 0;
let playbackSpeed = 1.0;

// טעינת המהירות השמורה בהפעלת התוסף
browser.storage.local.get('playbackSpeed').then(res => {
  if (res.playbackSpeed) playbackSpeed = parseFloat(res.playbackSpeed);
});

function updateBadge(text, color = "#2563eb") {
  browser.action.setBadgeText({ text });
  if (text) browser.action.setBadgeBackgroundColor({ color });
}

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.removeAll().then(() => {
    browser.contextMenus.create({ id: "read-selected-text", title: "🗣️ הקרא טקסט מסומן (Alt+S)", contexts: ["selection"] });
    browser.contextMenus.create({ id: "pause-resume-tts", title: "⏯️ השהה / המשך הקראה", contexts: ["all"] });
    browser.contextMenus.create({ id: "stop-tts-audio", title: "⏹️ עצור הקראה (Alt+X)", contexts: ["all"] });
  });
});

function splitIntoSentences(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const rawChunks = cleaned.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [cleaned];
  const mergedChunks = [];
  let buffer = "";

  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    if ((buffer + " " + trimmed).trim().length < 90 && buffer.length < 25) {
      buffer = (buffer + " " + trimmed).trim();
    } else {
      if (buffer) mergedChunks.push(buffer);
      buffer = trimmed;
    }
  }
  if (buffer) mergedChunks.push(buffer);
  return mergedChunks;
}

function cleanupCurrentAudio() {
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
}

function stopPlayback() {
  sessionToken++;
  playbackQueue = [];
  isPlaying = false;
  isPaused = false;
  if (abortController) { abortController.abort(); abortController = null; }
  cleanupCurrentAudio();
  updateBadge("");
}

async function togglePauseResume() {
  if (!currentAudio) return false;
  if (isPaused) {
    isPaused = false;
    updateBadge("▶", "#16a34a");
    await currentAudio.play();
  } else {
    isPaused = true;
    currentAudio.pause();
    updateBadge("⏸", "#f59e0b");
  }
  return true;
}

async function fetchAudioBlob(text, signal) {
  const response = await fetch(TTS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ text }),
    signal
  });
  if (!response.ok) throw new Error(`שגיאת שרת: ${response.status}`);
  return await response.blob();
}

function playBlob(blob, token) {
  return new Promise((resolve, reject) => {
    if (token !== sessionToken) return resolve();
    cleanupCurrentAudio();
    currentAudioUrl = URL.createObjectURL(blob);
    currentAudio = new Audio(currentAudioUrl);
    currentAudio.playbackRate = playbackSpeed; // החלת המהירות שנבחרה
    
    currentAudio.onended = () => { cleanupCurrentAudio(); resolve(); };
    currentAudio.onerror = (err) => { cleanupCurrentAudio(); reject(err); };
    
    updateBadge("▶", "#16a34a");
    currentAudio.play().catch(reject);
  });
}

async function startSpeaking(text) {
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return;

  stopPlayback();
  const myToken = ++sessionToken;
  isPlaying = true;
  playbackQueue = sentences;
  abortController = new AbortController();
  updateBadge("...", "#2563eb");

  try {
    let nextBlobPromise = fetchAudioBlob(playbackQueue[0], abortController.signal);
    for (let i = 0; i < playbackQueue.length; i++) {
      if (myToken !== sessionToken) break;
      const currentBlob = await nextBlobPromise;
      if (myToken !== sessionToken) break;
      if (i + 1 < playbackQueue.length) {
        nextBlobPromise = fetchAudioBlob(playbackQueue[i + 1], abortController.signal);
      }
      await playBlob(currentBlob, myToken);
    }
    if (myToken === sessionToken) stopPlayback();
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("[Heb-TTS Error]:", error);
    updateBadge("ERR", "#dc2626");
    setTimeout(() => { if (myToken === sessionToken) updateBadge(""); }, 3500);
  }
}

async function getSelectedTextFromActiveTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return "";
  try {
    const results = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString().trim()
    });
    return results?.[0]?.result || "";
  } catch (e) {
    return "";
  }
}

// קבלת פקודות מחלון ה-Popup או מקיצורי מקלדת
browser.runtime.onMessage.addListener(async (message) => {
  if (message.command === "play-selected") {
    const selected = await getSelectedTextFromActiveTab();
    if (selected) await startSpeaking(selected);
  } else if (message.command === "toggle-pause") {
    await togglePauseResume();
  } else if (message.command === "stop") {
    stopPlayback();
  } else if (message.command === "set-speed") {
    playbackSpeed = parseFloat(message.speed);
    if (currentAudio) currentAudio.playbackRate = playbackSpeed; // עדכון חי גם בזמן דיבור
  }
});

browser.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "stop-tts-audio") stopPlayback();
  else if (info.menuItemId === "pause-resume-tts") await togglePauseResume();
  else if (info.menuItemId === "read-selected-text" && info.selectionText) await startSpeaking(info.selectionText);
});

browser.commands.onCommand.addListener(async (command) => {
  if (command === "stop-tts") stopPlayback();
  else if (command === "speak-or-pause") {
    const selected = await getSelectedTextFromActiveTab();
    if (selected && !isPlaying) await startSpeaking(selected);
    else if (isPlaying) await togglePauseResume();
  }
});
