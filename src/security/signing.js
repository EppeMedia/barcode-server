var encryption = require("./encryption.js");
var dbQueries = require("../http/dbQueries.js");

var exports = (module.exports = {});

exports.checkSignature = function(userID, message, signature, callback) {
  return new Promise(resolve => {
    
    dbQueries.getPublicKey(userID, rows => {
      if (rows.length === 1) {
        // Get public key:
        let publicKey = rows[0].public_key;

        // Check signature
        const valid = encryption.checkSignature(message, signature, publicKey);

        resolve(valid);
        callback(valid);

      } else {
        console.log(`No public key found for user ${userID}`);
        resolve(false);
        callback(false);
      }
    });
  });
};
