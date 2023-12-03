let currentAudio = null;
let isProcessing = false;

const createExtensionButton = (searchResultLink) => {
  let button = document.createElement("button");
  button.className = "HearMeOut-extension";
  button.addEventListener("click", (e) =>
    onButtonClick(e, searchResultLink.href)
  );
  return button;
};

document.querySelectorAll("#search a h3").forEach((searchResultTitle) => {
  const searchResultLink = searchResultTitle.parentNode;
  const extensionButton = createExtensionButton(searchResultLink);
  searchResultLink.parentNode.insertBefore(extensionButton, searchResultLink);
});

const onButtonClick = (e, searchResultUrl) => {
  if (isProcessing) return;

  disableExtensionButtons(true);

  const target = e.target || e.srcElement;
  target.classList.add("HearMeOut-loading");

  chrome.storage.local.get(["key_openai"], function (items) {
    urlToAiAudio(searchResultUrl, items.key_openai);
  });
};

function playAudio(url) {
  stopAudio();
  setCurrentPlugStatus(PLUG_STATUS.AUDIO_PLAYING);
  currentAudio = new Audio(url);
  currentAudio.playbackRate = 1.1;
  currentAudio.type = "audio/opus";
  currentAudio.play();
  currentAudio.onplay = () => setAudioPlaying(true);
  currentAudio.onpause = currentAudio.onended = () => setAudioPlaying(false);
}

const stopAudio = () => {
  if (!currentAudio) return;

  currentAudio.pause();
  currentAudio = null;
};

// Messages from the extension popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "stopAudio") {
    stopAudio();
  }
});

const setAudioPlaying = (isPlaying) => {
  setCurrentPlugStatus(
    isPlaying ? PLUG_STATUS.AUDIO_PLAYING : PLUG_STATUS.IDLE
  );
  disableExtensionButtons(false);
};

const disableExtensionButtons = (disable) => {
  isProcessing = disable;

  document.querySelectorAll(".HearMeOut-extension").forEach((elem) => {
    if (disable) {
      elem.classList.add("HearMeOut-disabled");
    } else {
      elem.classList.remove("HearMeOut-disabled");
    }

    elem.classList.remove("HearMeOut-loading");
  });
};
