const DEFAULT_SETTINGS = {
  enabled: true,
  theme: "dark",
  fontScale: 100
};

const enabledInput = document.getElementById("enabled");
const themeInput = document.getElementById("theme");
const fontScaleInput = document.getElementById("fontScale");
const fontScaleValue = document.getElementById("fontScaleValue");
const resetButton = document.getElementById("reset");
const statusText = document.getElementById("status");

function setStatus(message) {
  statusText.textContent = message;
  window.clearTimeout(setStatus.timeoutId);
  setStatus.timeoutId = window.setTimeout(() => {
    statusText.textContent = "";
  }, 1800);
}

function updateScaleLabel(value) {
  fontScaleValue.value = `${value}%`;
  fontScaleValue.textContent = `${value}%`;
}

function syncForm(settings) {
  enabledInput.checked = settings.enabled;
  themeInput.value = settings.theme;
  fontScaleInput.value = settings.fontScale;
  updateScaleLabel(settings.fontScale);
}

async function loadSettings() {
  const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  syncForm(result);
}

async function saveSettings() {
  const settings = {
    enabled: enabledInput.checked,
    theme: themeInput.value,
    fontScale: Number(fontScaleInput.value)
  };

  await chrome.storage.sync.set(settings);
  setStatus("Ayarlar kaydedildi.");
}

enabledInput.addEventListener("change", saveSettings);
themeInput.addEventListener("change", saveSettings);
fontScaleInput.addEventListener("input", () => {
  updateScaleLabel(fontScaleInput.value);
});
fontScaleInput.addEventListener("change", saveSettings);

resetButton.addEventListener("click", async () => {
  await chrome.storage.sync.set(DEFAULT_SETTINGS);
  syncForm(DEFAULT_SETTINGS);
  setStatus("Varsayilan ayarlar yuklendi.");
});

loadSettings();
