const PLUG_STATUS = {
  IDLE: "Waiting",
  URL_TO_TEXT: "Summarizing URL to text",
  TEXT_TO_AUDIO: "Converting text to audio",
  AUDIO_PLAYING: "Audio playing",

  ERROR_OPENAI: "HearMeOut: OpenApi error",
  ERROR_CONFIG: "HearMeOut: check API key and reload!",
  ERROR_SUMMARY: "HearMeOut: AI cannot summarize url",
};

const CANNOT_SUMMARIZE_KEYWORD = "CANNOT";

let currentPlugStatus = PLUG_STATUS.IDLE;

const setCurrentPlugStatus = (newStatus) => {
  currentPlugStatus = newStatus;
  chrome.storage.local.set({ currentPlugStatus: currentPlugStatus });
  chrome.runtime.sendMessage({
    action: "updateStatus",
    value: currentPlugStatus,
  });

  if (
    [
      PLUG_STATUS.ERROR_CONFIG,
      PLUG_STATUS.ERROR_OPENAI,
      PLUG_STATUS.ERROR_SUMMARY,
    ].includes(newStatus)
  ) {
    alert(newStatus);
  }
};

const urlToAiAudio = (searchResultUrl, openAiKey) => {
  if (!validConfig(openAiKey)) return;

  const openAIHandler = new OpenAIHandler(openAiKey);
  openAIHandler.summarizeUrl(searchResultUrl).then((data) => {
    if (!data) {
      setCurrentPlugStatus(PLUG_STATUS.ERROR_OPENAI);
      return;
    }

    const openAiText = data.choices[0].message.content;
    console.log("HearMeOut, OpenAI response:", openAiText);

    // gpt couldnt summarize for some reason
    if (
      !openAiText ||
      openAiText.trim().toUpperCase() === CANNOT_SUMMARIZE_KEYWORD
    ) {
      setCurrentPlugStatus(PLUG_STATUS.ERROR_SUMMARY);
      return;
    }

    openAIHandler.textToSpeech(openAiText).then((audioUrl) => {
      if (!audioUrl) {
        setCurrentPlugStatus(PLUG_STATUS.ERROR_OPENAI);
        return;
      }

      playAudio(audioUrl);
    });
  });
};

const validConfig = (openAiKey) => {
  if (!openAiKey) {
    setCurrentPlugStatus(PLUG_STATUS.ERROR_CONFIG);
    return false;
  }

  // maybe more checks here ?
  return true;
};
