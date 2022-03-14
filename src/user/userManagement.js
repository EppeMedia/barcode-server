var errorResponse = require("../http/errorResponse.js");
var signing = require("../security/signing.js");
var encryption = require("../security/encryption.js");
var dbQueries = require("../http/dbQueries.js");
var jwt = require("jsonwebtoken");
var config = require("../config.js");

var exports = (module.exports = {});

exports.createOrganization = function(req, callback) {
  return new Promise(resolve => {
    callback({ message: "stub!", status: 400, error: true});
    return resolve({ message: "stub!", status: 400, error: true});
  });
};

exports.updateOrganization = function(req, callback) {
  return new Promise(resolve => {
    callback({ message: "stub!", status: 400, error: true});
    return resolve({ message: "stub!", status: 400, error: true});
  });
};

exports.deleteOrganization = function(req, callback) {
  return new Promise(resolve => {
    callback({ message: "stub!", status: 400, error: true});
    return resolve({ message: "stub!", status: 400, error: true});
  });
};

exports.registerUser = function(req, res, dun) {
  return new Promise(resolve => {

    const body = req.body;
    if (!body) {
      // No body supplied.
      const error = errorResponse.error("Missing body!", 400, res);
      return resolve(error);
    }

    const email = body.email;
    if (!email) {
      const error = errorResponse.error("Missing credentials!", 400, res);
      return resolve(error);
    }

    const password = body.password;
    if (!password) {
      const error = errorResponse.error("Missing credentials!", 400, res);
      return resolve(error);
    }

    const name = body.name;
    if (!name) {
      const error = errorResponse.error("Missing credentials!", 400, res);
      return resolve(error);
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
            const result = {
              message: "Successfully registered user!",
              privateKey: keyPair.privateKey
            };

            res.status(200);
            res.send(result);
            
            return resolve(result);
          } else {
            if (error.code === "23505") {
              const err = errorResponse.error(
                `Failed to register user; email address already in use! [${error.code}]`,
                400,
                res
              );
              return resolve(err);
            } else {
              const err = errorResponse.error("Failed to register user!", 400, res);
              return resolve(err);
            }
          }
        }
      );
    });
  });
};

exports.requestLogin = function(req, callback) {
  return new Promise(resolve => {

    if (!req) {
      // No body supplied.
      callback({ message: "Missing request body!", status: 400});
      return resolve({ message: "Missing request body!", status: 400});
    }

    const email = req.email;
    if (!email) {
      // No email supplied.
      callback({ message: "Missing attributes!", status: 400});
      return resolve({ message: "Missing attributes!", status: 400});
    }

    const password = req.password;
    if (!password) {
      // No password supplied
      callback({ message: "Missing attributes!", status: 400});
      return resolve({ message: "Missing attributes!", status: 400});
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
        callback({ message: "Invalid credentials!", status: 400});
        return resolve({ message: "Invalid credentials!", status: 400});
      }

      // Check credentials
      encryption.checkPassword(password, user.password_hash, function(err, res) {
        if (err || !res) {
          // Passwords invalid
          callback({ message: "Invalid credentials!", status: 400});
          return resolve({ message: "Invalid credentials!", status: 400});
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
              callback(error, 500);
              return resolve(error, 500);
            }
            callback(false, 200, { userID: user.id, token });
            return resolve({
              error: false,
              status: 200,
              user: { userID: user.id, token }});
          }
        );
      });
    });

  });
};
