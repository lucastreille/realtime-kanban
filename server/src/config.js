function parseTokenList(envVar, defaultValue) {
  if (!envVar) {
    return defaultValue;
  }
  return envVar
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

const adminTokens = parseTokenList(process.env.ADMIN_TOKENS, [
  "YU!i[O\"{(\\!Iq-LVtuuPf/zPDqS!UX.j75pAXo(=E#.@}7xr2wF,JDULGS]Y'xEqx[gg{BR-mS'P)O60wgaF-H8t/|.QOpGm|-r!",
]);

const validTokens = parseTokenList(process.env.VALID_TOKENS, [
  'wb6Y"ROv.yvJx|r0Ra.PFuX"t(KHUaR-:I\'w-Tgm/0"PIy5SMcPs-}rLd8waF}Wf93=ktRgBC#;W71W/PadDAK{0j2lmJivU;z?0',
]);

module.exports = {
  port: process.env.PORT || 3000,

  maxMessageSize: 100,
  maxBoardsTotal: 100,
  maxTasksPerBoard: 1000,

  rateLimit: {
    maxMessagesPerSecond: 5,
    maxMessagesPerMinute: 10,
    windowMs: 1000,
  },

  auth: {
    adminTokens,
    validTokens,

    minPseudoLength: 1,
    maxPseudoLength: 20,
    pseudoPattern: /^[a-zA-Z0-9 _-]+$/,
  },

  maxBoardIdLength: 30,
  boardIdPattern: /^[a-zA-Z0-9_-]+$/,
};
