// Changes on every build. Appended to CSS and JS URLs (?v=) so browsers fetch the new files after a deploy,
// even though nginx lets them cache /assets/ for a week.
module.exports = {
  version: Date.now().toString(36),
};
