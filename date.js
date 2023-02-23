let options = {
  weekday: "long",
};

let day = new Date().toLocaleDateString("en-US", options);

module.exports = day;
