function pick(object, keys) {
  return keys.reduce((accumulator, key) => {
    if (object[key] !== undefined) {
      accumulator[key] = object[key];
    }

    return accumulator;
  }, {});
}

module.exports = pick;
