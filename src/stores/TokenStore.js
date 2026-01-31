class TokenStore {
  constructor() {
    this.tokens = new Map();
  }

  addToken(token) {
    this.tokens.set(token.id, token);
    return token;
  }

  getToken(tokenId) {
    return this.tokens.get(tokenId);
  }

  updateToken(token) {
    this.tokens.set(token.id, token);
    return token;
  }

  deleteToken(tokenId) {
    return this.tokens.delete(tokenId);
  }

  getAllTokens() {
    return Array.from(this.tokens.values());
  }

  getTokensBySlot(slotId) {
    return this.getAllTokens().filter(token => token.slotId === slotId);
  }

  getTokensByDoctor(doctorId) {
    return this.getAllTokens().filter(token => token.doctorId === doctorId);
  }

  getTokensByPatient(patientId) {
    return this.getAllTokens().filter(token => token.patientId === patientId);
  }

  getTokensByState(state) {
    return this.getAllTokens().filter(token => token.state === state);
  }

  getTokensByType(tokenType) {
    return this.getAllTokens().filter(token => token.tokenType === tokenType);
  }

  clear() {
    this.tokens.clear();
  }
}

module.exports = TokenStore;
