var errorResponse = require("../http/errorResponse.js");
var signing = require("../security/signing.js");
var encryption = require("../security/encryption.js");
var dbQueries = require("../http/dbQueries.js");
var jwt = require("jsonwebtoken");
var config = require("../config.js");

var exports = (module.exports = {});

exports.registerUser = function(req, res) {
  const body = req.body;
  if (!body) {
    // No body supplied.
    errorResponse.error("Missing body!", 400, res);
    return;
  }

  const email = body.email;
  if (!email) {
    errorResponse.error("Missing credentials!", 400, res);
    return;
  }

  const password = body.password;
  if (!password) {
    errorResponse.error("Missing credentials!", 400, res);
    return;
  }

  const name = body.name;
  if (!name) {
    errorResponse.error("Missing credentials!", 400, res);
    return;
  }

  // Generate key pair
  const keyPair = encryption.generateKeyPair(password);

  // Hash and salt the password:
  encryption.hashPassword(password, passwordHash => {
    // The pasword hash contains the salt; no need to store seperately.
    dbQueries.registerUser(
      email,
      name,
      keyPair.publicKey,
      passwordHash,
      error => {
        if (!error) {
          // Successfully registered user!

          res.status(200);
          res.send({
            message: "Successfully registered user!",
            privateKey: keyPair.privateKey
          });
        } else {
          if (error.code === "23505") {
            errorResponse.error(
              `Failed to register user; email address already in use! [${error.code}]`,
              400,
              res
            );
          } else {
            console.log(error);
            errorResponse.error("Failed to register user!", 400, res);
          }
        }
      }
    );
  });
};

exports.requestLogin = function(req, callback) {
  if (!req) {
    // No body supplied.
    return callback({ message: "Missing request body!" }, 400);
  }

  const email = req.email;
  if (!email) {
    // No email supplied.
    return callback({ message: "Missing attributes!" }, 400);
  }

  const password = req.password;
  if (!password) {
    // No password supplied
    return callback({ message: "Missing attributes!" }, 400);
  }

  // Requested lifespan in seconds; must be smaller than the maximum, larger than the minimum
  let sessionLifespan = req.sessionLifespan;
  if (!sessionLifespan) {
    // No lifespan requested
    sessionLifespan = config.jwtMaxLifespan;
  }
  // Check if request is within limits
  else if (sessionLifespan < config.jwtMinLifespan) {
    sessionLifespan = config.jwtMinLifespan;
  } else if (sessionLifespan > config.jwtMaxLifespan) {
    sessionLifespan = config.jwtMaxLifespan;
  }

  // Retrieve user account from database
  dbQueries.getUserByEmail(email, (error, user) => {
    if (error || !user) {
      return callback({ message: "Invalid credentials!" }, 400);
    }

    // Check credentials
    encryption.checkPassword(password, user.password_hash, function(err, res) {
      if (err || !res) {
        // Passwords invalid
        return callback({ message: "Invalid credentials!" }, 400);
      }

      // Credentials valid

      // Generate JWT token
      jwt.sign(
        { email, userID: user.id },
        config.jwtSecret,
        {
          expiresIn: sessionLifespan
        },
        (error, token) => {
          if (error) {
            return callback(error, 500);
          }
          return callback(false, 200, { userID: user.id, token });
        }
      );
    });
  });
};
