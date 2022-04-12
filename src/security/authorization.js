var errorResponse = require("../http/errorResponse.js");
var signing = require("../security/signing.js");
var encryption = require("./encryption.js");
var jwt = require("jsonwebtoken");
var config = require("../config.js");

var exports = (module.exports = {});

exports.checkJWTRequestHeaders = function(req, res, next) {
  // Documentation on authorization headers: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization
  // Using jwt headers: https://medium.com/dev-bits/a-guide-for-adding-jwt-token-based-authentication-to-your-single-page-nodejs-applications-c403f7cf04f4

  let token = req.headers["x-access-token"] || req.headers["authorization"]; // Express headers are auto converted to lowercase

  if (token) {
    if (token.startsWith("Bearer ")) {
      token = token.replace(/\"/g, "");

      // Remove "Bearer " from string
      token = token.slice(7, token.length);
    }

    jwt.verify(token, config.jwtSecret, (err, decoded) => {
      if (err) {
        res.status(401); //BUG: used to return 200 instead of 401
        res.json({
          success: false,
          message: "Token is invalid!",
          errorCode: 0xdeadbeef
        });
        return res;
      } else {
        // Token is verified and valid; continue to next middleware

        // If userID is in the requestAnimationFrame, check if it matches the token:
        if (req.query.userID && req.query.userID != decoded.userID) {
          res.status(401);//BUG: used to return 200 instead of 401
          res.json({
            success: false,
            message: "Token is invalid!"
          });
          return res;
        } else if (req.body.userID && req.body.userID != decoded.userID) {
          res.status(401);//BUG: used to return 200 instead of 401
          res.json({
            success: false,
            message: "Token is invalid!"
          });
          return res;
        }

        next();
      }
    });
  } else {
    res.status(401)//BUG: used to return 200 instead of 401
    res.json({
      success: false,
      message: "Authorization token is not supplied"
    });
    return res;
  }
  // END

  /*
  const authorization = req.get("Authorization");
  // Check if request is complete
  if (!authorization) {
    // Incomplete request
    errorResponse.error(
      "Request incomplete! Missing authorization headers!",
      400,
      res
    );

    return false;
  }

  // Check if the right authorization method is being used
  const authorizationMethod = authorization.split(" ")[0];
  if (authorizationMethod !== "Basic") {
    // Faulty request
    errorResponse.error(
      "Request invalid: unsupported authorization method!",
      401,
      res
    );

    return false;
  }

  const authorizationContent = Buffer.from(
    authorization.split(" ")[1],
    "base64"
  ).toString("utf8");

  // Check if the credentials are well-formatted
  if (authorizationContent.split(":").length !== 2) {
    // Faulty request
    errorResponse.error("Request invalid: malformed credentials!", 401, res);

    return false;
  }

  // Check request credentials
  const credentials = authorizationContent.split(":");
  const terminalID = credentials[0];
  const signature = credentials[1];

  if (signing.checkSignature(terminalID, terminalID, signature) !== true) {
    // This request is not signed correctly! Respond with error.
    errorResponse.error("Digital signature is not valid!", 401, res);

    return false;
  }

  return true;
  */
};
