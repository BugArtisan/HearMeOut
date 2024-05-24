class OpenAIHandler {
  // Test mode flags to skip some api calls, calls are not free eh!
  TEST_MODE_DISABLE_SUMMARY = false;
  TEST_MODE_DISABLE_TTS = false;

  constructor(apiKey) {
    this.apiKey = apiKey;

    // Future idea: allow those to be customized by the user, that's why it's here
    this.summarizeEndpoint = "https://api.openai.com/v1/chat/completions";
    this.summarizePrompt =
      "Directly list the specific key points or tips detailed in the article from the provided URL in a bullet-point format. " +
      "Please limit your summary to around 200 words, ensuring each point is concise. " +
      "Avoid any general overview, introductory statements, or conclusions. " +
      "Focus exclusively on enumerating the distinct points discussed in the article." +
      "IMPORTANT: If for any reason you cannot provide the summary, reply with only the word '" +
      CANNOT_SUMMARIZE_KEYWORD +
      "' in uppercase.";
    this.summarizeMaxTokens = 300;

    // I tried gpt-4o but it cannot summarize, says it can't browse the web LOL
    this.summarizeModel = "gpt-3.5-turbo";

    this.ttsEndpoint = "https://api.openai.com/v1/audio/speech";
    this.ttsModel = "tts-1";
    this.ttsVoice = "alloy";
    this.ttsSpeed = 1.0; // not sure to custo this, it distorts the voice whereas audio playbackRate is fine
  }

  async _fetch(url, jsonData) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response;
  }

  // TODO do something better
  _handleException(e) {
    console.error(e);
    return null;
  }

  async summarizeUrl(urlToInspect) {
    setCurrentPlugStatus(PLUG_STATUS.URL_TO_TEXT);

    if (this.TEST_MODE_DISABLE_SUMMARY) return this.getTestModeSummary();

    const jsonData = this.getSummarizeUrlJsonData(urlToInspect);
    try {
      const response = await this._fetch(this.summarizeEndpoint, jsonData);
      return response.json();
    } catch (e) {
      return this._handleException(e);
    }
  }

  getSummarizeUrlJsonData(urlToInspect) {
    return {
      messages: [
        { role: "system", content: this.summarizePrompt },
        { role: "user", content: urlToInspect },
      ],
      max_tokens: this.summarizeMaxTokens,
      model: this.summarizeModel,
    };
  }

  async textToSpeech(text) {
    setCurrentPlugStatus(PLUG_STATUS.TEXT_TO_AUDIO);

    if (this.TEST_MODE_DISABLE_TTS) return this.getTestModeAudio();

    const jsonData = this.getTextToSpeechJsonData(text);
    try {
      const response = await this._fetch(this.ttsEndpoint, jsonData);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (e) {
      return this._handleException(e);
    }
  }

  getTextToSpeechJsonData(text) {
    return {
      input: text,
      model: this.ttsModel,
      voice: this.ttsVoice,
      response_format: "opus", // for web stream/comms, low latency
      speed: this.ttsSpeed,
    };
  }

  //..test mode..

  getTestModeSummary() {
    console.log("Test mode, summary api call disabled !!");
    return {
      choices: [
        {
          message: {
            content: "This is a test mode text.",
            // testing when gpt cannot summarize
            // content: CANNOT_SUMMARIZE_KEYWORD,
          },
        },
      ],
    };
  }

  getTestModeAudio() {
    console.log("Test mode, TTS api call disabled !!");
    return "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg";
  }
}
