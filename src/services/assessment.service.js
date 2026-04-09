const { scoreEligibility } = require("../utils/scoreEligibility.js");

const evaluateEligibility = (input) => {
  return scoreEligibility(input);
};
module.exports = { evaluateEligibility };
