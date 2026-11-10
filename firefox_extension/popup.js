document.getElementById('btn-play').addEventListener('click', () => {
    browser.runtime.sendMessage({ command: "play-selected" });
});

document.getElementById('btn-pause').addEventListener('click', () => {
    browser.runtime.sendMessage({ command: "toggle-pause" });
});

document.getElementById('btn-stop').addEventListener('click', () => {
    browser.runtime.sendMessage({ command: "stop" });
});

const speedInput = document.getElementById('speed');
const speedVal = document.getElementById('speed-val');

// טעינת המהירות שנשמרה בעבר
browser.storage.local.get('playbackSpeed').then(res => {
    if (res.playbackSpeed) {
        speedInput.value = res.playbackSpeed;
        speedVal.textContent = parseFloat(res.playbackSpeed).toFixed(1);
    }
});

// עדכון מהירות בזמן אמת ושמירה
speedInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value).toFixed(1);
    speedVal.textContent = val;
    browser.storage.local.set({ playbackSpeed: val });
    browser.runtime.sendMessage({ command: "set-speed", speed: val });
});
