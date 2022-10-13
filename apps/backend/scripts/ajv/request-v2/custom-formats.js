module.exports = {
  noEmptyString: {
    type: "string",
    validate: (x) => (x !== "" ? true : false),
  },
};
