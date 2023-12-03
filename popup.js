const KEYNAME_OPENAI = "key_openai";

document.addEventListener("DOMContentLoaded", function () {
  displayExtensionVersion();

  // Storage reading to adapt the UI
  chrome.storage.local.get(
    [KEYNAME_OPENAI, "currentPlugStatus"],
    function (result) {
      setKeyInputValue(KEYNAME_OPENAI, result);
      setStatus(result.currentPlugStatus);
    }
  );

  // Click to stop audio
  document.getElementById("stopButton").addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "stopAudio" });
    });
  });

  addKeyInputEvent(KEYNAME_OPENAI);
});

// Messages from content
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "updateStatus") {
    setStatus(request.value);
  }
});

const toggleStopButton = (status) => {
  const stopButton = document.getElementById("stopButton");
  if (!stopButton) return;
  const isAudioPlaying = status === "Audio playing";

  stopButton.disabled = !isAudioPlaying;
  stopButton.title = isAudioPlaying
    ? ""
    : "No audio playing, follow the instructions.";
};

const setKeyInputValue = (keyName, result) => {
  const keyValue = result[keyName] ?? "";
  const elem = document.getElementById(keyName);
  elem.value = keyValue;
  toggleKeyInputIcons(elem.parentNode, keyValue);
};

const toggleKeyInputIcons = (keyInputParent, keyValue) => {
  keyInputParent.querySelector(".loading").style.display =
    keyValue != "" ? "none" : "block";
  keyInputParent.querySelector(".check").style.display =
    keyValue != "" ? "block" : "none";
};

const addKeyInputEvent = (keyName) => {
  const elem = document.getElementById(keyName);
  elem.addEventListener("paste", function () {
    // timeout for the paste to be done
    setTimeout(() => {
      chrome.storage.local.set({ [keyName]: elem.value }, function () {
        toggleKeyInputIcons(elem.parentNode, elem.value);
      });
    }, 1);
  });
};

const setStatus = (status) => {
  toggleStopButton(status);

  const container = document.getElementById("status-container");
  if (!container) return;

  if (!status) {
    container.style.display = "none";
    return;
  }

  document.getElementById("status").innerText = status;
  container.style.display = "block";
};

const displayExtensionVersion = () => {
  const manifestData = chrome.runtime.getManifest();
  document.getElementById("version").textContent = "v" + manifestData.version;
};
