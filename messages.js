const MESSAGE_TYPES = {
  GET_SELECTION: "GET_SELECTION",
  SELECTION_RESPONSE: "SELECTION_RESPONSE",
  OPEN_POPUP: "OPEN_POPUP",
  TRANSLATE_REQUEST: "TRANSLATE_REQUEST",
  TRANSLATE_RESPONSE: "TRANSLATE_RESPONSE",
  CHECK_GRAMMAR: "CHECK_GRAMMAR",
  ERROR: "ERROR"
};

function createMessage(type, payload = {}) {
  return {
    type,
    payload,
    timestamp: Date.now()
  };
}

function isValidMessage(message) {
  return message && typeof message === 'object' && message.type in MESSAGE_TYPES;
}
