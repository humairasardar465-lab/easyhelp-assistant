// custom-objects.js

let CUSTOM_OBJECTS = [];
let CUSTOM_LANGUAGES = [];
let CUSTOM_SELECTED_LANG = "ur-PK";

async function loadCustomObjects() {
  try {
    const res = await fetch("objects.json");
    const data = await res.json();

    CUSTOM_LANGUAGES = data.languages || [];
    CUSTOM_OBJECTS = data.objects || [];

    if (!CUSTOM_LANGUAGES.includes(CUSTOM_SELECTED_LANG)) {
      CUSTOM_SELECTED_LANG = CUSTOM_LANGUAGES[0] || "ur-PK";
    }

    fillLanguageSelect();
    return true;
  } catch (e) {
    return false;
  }
}

function fillLanguageSelect() {
  const sel = document.getElementById("languageSelect");
  if (!sel) return;
  if (sel.options.length > 0) return;

  CUSTOM_LANGUAGES.forEach((code) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = code;
    if (code === CUSTOM_SELECTED_LANG) opt.selected = true;
    sel.appendChild(opt);
  });

  sel.addEventListener("change", () => {
    setCustomLanguage(sel.value);
  });
}

function setCustomLanguage(code) {
  if (CUSTOM_LANGUAGES.includes(code)) {
    CUSTOM_SELECTED_LANG = code;
  }
}

function getObjectName(objectId, langCode) {
  const lang = langCode || CUSTOM_SELECTED_LANG;
  const obj = CUSTOM_OBJECTS.find((o) => o.id === objectId);
  if (!obj) return objectId;

  const index = CUSTOM_LANGUAGES.indexOf(lang);
  if (index === -1) return obj.names[0] || objectId;

  return obj.names[index] || obj.names[0] || objectId;
}

function speakObject(objectId) {
  const text = getObjectName(objectId, CUSTOM_SELECTED_LANG);

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  } else {
    alert(text);
    return;
  }

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = CUSTOM_SELECTED_LANG;
  utter.rate = 0.9;
  utter.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((v) => v.lang === CUSTOM_SELECTED_LANG)
    || voices.find((v) => v.lang && v.lang.startsWith(CUSTOM_SELECTED_LANG.split("-")[0]));
  if (voice) utter.voice = voice;

  window.speechSynthesis.speak(utter);
}

document.addEventListener("DOMContentLoaded", () => {
  loadCustomObjects();
});

window.loadCustomObjects = loadCustomObjects;
window.setCustomLanguage = setCustomLanguage;
window.getObjectName = getObjectName;
window.speakObject = speakObject;