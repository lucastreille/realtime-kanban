const crypto = require("crypto");

const userTokens = new Map();

function generateUserToken(pseudo) {
  const token = crypto.randomUUID();
  userTokens.set(token, { pseudo, createdAt: Date.now() });
  return token;
}

function getPseudoByToken(token) {
  const entry = userTokens.get(token);
  return entry ? entry.pseudo : null;
}

function isUserToken(token) {
  return userTokens.has(token);
}

function removeUserToken(token) {
  userTokens.delete(token);
}

module.exports = {
  generateUserToken,
  getPseudoByToken,
  isUserToken,
  removeUserToken,
};
