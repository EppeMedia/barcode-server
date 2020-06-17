const eventBus = require("./eventBus.js");

function get(req, res) {
  res.send("Hello World! From get!");
}

eventBus.on("get", get);
