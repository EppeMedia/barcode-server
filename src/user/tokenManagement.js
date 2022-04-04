var errorResponse = require("../http/errorResponse.js");
var signing = require("../security/signing.js");
var encryption = require("../security/encryption.js");
var dbQueries = require("../http/dbQueries.js");
var config = require("../config.js");

var exports = (module.exports = {});

exports.registerToken = function(body, callback) {
  return new Promise(resolve => {
  const expires = body.expires;
  if (!expires) {
    console.warn("Warn: Issuing token with no expiration date!");
  }

  const userID = body.userID;
  if (!userID) {
    // No userID supplied.
    callback({ message: "Missing userID attribute!", status: 400}, 400);
    return resolve({ message: "Missing userID attribute!", status: 400 });
  }

  let signature = body.signature;
  if (!signature) {
    console.warn("Warn: Issuing token without signature!");
    signature = "signature_placeholder";
  }

  const description = body.description;
  if (!description) {
    // No description supplied.
    callback({ message: "Missing description attribute!" });
    return resolve({ message: "Missing description attribute!", status: 400});
  }

  // Can be undefined
  const batchPermissions = body.batchPermissions;
  if (batchPermissions && batchPermissions.length !== 0) {
    // There are batch permissions (nested objects) in the request. Check their format:
    for (let i = 0; i < batchPermissions.length; i++) {
      if (!batchPermissions[i].batchID || !batchPermissions[i].permissions) {
        // Malformed request; every batch permission element needs a batchID and permissions attribute.
        callback(
          { message: "Malformed batchPermissions attribute!" },
          400
        );
        return resolve({ message: "Malformed batchPermissions attribute!", status: 400})
      }
    }
  }

  encryption.generateToken(config.tokenSize, token => {
    dbQueries.registerToken(
      userID,
      token,
      expires,
      signature,
      description,
      batchPermissions,
      (error, tokenID) => {
        if (error) {
          callback({ message: "Unable to register token!" }, 400)
          return resolve({ message: "Unable to register token", status: 400});
        }

        callback(false, 200, tokenID);
        return resolve({ error:false, message: "Successful token registration", status: 200 })
      }
    );
  });
});
  /*
  const signature = body.signature;
  if (!signature) {
    // No signature supplied.
    errorResponse.error("Request not signed!", 400, res);
    return;
  }

  // Check signature
  const signatureBuffer = Buffer.from(signature, "hex");
  const message = `${userID}${permissions}${description}${
    expires ? expires : ``
  }`;
  signing.checkSignature(userID, message, signatureBuffer, valid => {
    if (valid) {
      // Generate and store token

      encryption.generateToken(config.tokenSize, token => {
        dbQueries.registerToken(
          userID,
          token,
          expires,
          permissions,
          signature,
          description,
          (error, results) => {
            if (error) {
              errorResponse.error("Unable to register token!", 500, res);
            } else {
              res.status(200);
              res.send({
                message: "Successfully registered token!",
                userID,
                token
              });
            }
          }
        );
      });
    } else {
      errorResponse.error(
        "Invalid signature; unable to register token!",
        400,
        res
      );
    }
  });
  */
};

exports.checkToken = function(req, callback) {
  if (!req) {
    // No body supplied.
    return callback({ message: "Missing request body!" }, 400);
  }

  const userID = req.userID;
  if (!userID) {
    // No userID supplied.
    return callback({ message: "Missing attributes!" }, 400);
  }

  const token = req.token;
  if (!token) {
    // No token supplied.
    return callback({ message: "Missing attributes!" }, 400);
  }

  // Query database for token with given userID
  dbQueries.checkToken(userID, token, (error, token) => {
    if (error) {
      return callback(
        { message: `Could not check token for user ${userID}!` },
        400
      );
    }

    if (!token) {
      // Token does not exist
      return callback({ message: `Invalid token for user ${userID}!` }, 400);
    }

    // Check if token is expired (time in Unix epoch seconds)
    const currentTime = Date.now() / 1000;
    if (currentTime >= token.expires) {
      return callback(
        { message: `Token expired at timestamp ${token.expires}!` },
        400
      );
    }

    // Token is valid
    callback(false, 200, token);
  });
};

exports.getTokens = function(req, callback) {
  if (!req) {
    // No body supplied.
    return callback({ message: "Missing request body!" }, 400);
  }

  const userID = req.userID;
  if (!userID) {
    // No userID supplied.
    return callback({ message: "Missing attributes!" }, 400);
  }

  dbQueries.getTokens(userID, (error, results) => {
    if (error) {
      return callback({ message: "Unable to get tokens!" }, 500);
    }

    return callback(false, 200, results);
  });
};

exports.getToken = function(req, callback) {
  if (!req) {
    // No body supplied.
    return callback({ message: "Missing request body!" }, 400);
  }

  const tokenID = req.tokenID;
  if (!tokenID) {
    // No userID supplied.
    return callback({ message: "Missing attributes!" }, 400);
  }

  dbQueries.getToken(tokenID, (error, result) => {
    if (error) {
      return callback({ message: "Unable to get tokens!" }, 500);
    }

    return callback(false, 200, result);
  });
};
