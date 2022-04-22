var crypto = require("crypto");
var bcrypt = require("bcryptjs");
var config = require("../config.js");

var exports = (module.exports = {});

// Adaptation of: https://nodejs.org/api/crypto.html#crypto_class_sign

// Generate a key pair
exports.generateKeyPair = function(passphrase) {
  return ({ privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: config.rsaModulusLength,
    publicKeyEncoding: {
      type: "spki",
      format: "pem"
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
      cipher: "aes-256-cbc", // gcm ipv cbc -> Gaillois/Counter Mode
      passphrase
    }
  }));
};

exports.randomHex = function(length, callback) {
  crypto.randomBytes(length, function(err, buffer) {
    if (err) {
      throw err;
    }
    callback(buffer);
  });
};

exports.generateToken = function(length, callback) {
  exports.randomHex(length, buffer => {
    const hex = buffer.toString("hex");
    callback(hex);
  });
};

// Sign a message
exports.signMessage = function(message, privateKey, passphrase) {
  const sign = crypto.createSign("SHA256");
  sign.update(message);
  sign.end();

  const params = {
    key: privateKey,
  };

  if (passphrase)
    params.passphrase = passphrase;

  const signature = sign.sign(params);

  return signature.toString("hex");
};

// Verify the signature of a message
exports.checkSignature = function(message, signature, publicKey) {
  const verify = crypto.createVerify("SHA256");
  verify.update(message);
  verify.end();
  const valid = verify.verify(publicKey, signature);

  return valid;
};

exports.hashPassword = function(password, callback) {
  bcrypt.genSalt(14, function(err, salt) {
    if (err) {
      console.log(err);
      return;
    }

    bcrypt.hash(password, salt, function(err, hash) {
      if (err) {
        console.log(err);
        return;
      }

      callback(hash);
    });
  });
};

exports.checkPassword = function(password, passwordHash, callback) {
  bcrypt.compare(password, passwordHash, callback);
};
