function buildChain(...handlers) {
  const valid = handlers.filter(Boolean);
  if (valid.length === 0) throw new Error('buildChain requiere al menos un handler');

  for (let i = 0; i < valid.length - 1; i += 1) {
    valid[i].setNext(valid[i + 1]);
  }
  return valid[0];
}

module.exports = buildChain;
