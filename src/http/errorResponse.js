var exports = (module.exports = {});

exports.error = function(message, code, res) {
  const response = {
    message,
    code,
    status: code, // alias
  };

  res.status(code);
  res.send(response);

  return response;
};

exports.sendError = function(error, status, res) {
  res.status(status);
  res.send(error);
};
