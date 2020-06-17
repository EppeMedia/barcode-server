var encryption = require("./encryption.js");
var dbQueries = require("../http/dbQueries.js");

var exports = (module.exports = {});

exports.checkSignature = function(userID, message, signature, callback) {
  // TODO: load device's public key from database
  dbQueries.getPublicKey(userID, rows => {
    if (rows.length === 1) {
      // Get public key:
      let publicKey = rows[0].public_key;

      // Check signature
      const valid = encryption.checkSignature(message, signature, publicKey);

      return callback(valid);
    } else {
      console.log(`No public key found for user ${userID}`);
      callback(false);
    }
  });
};
