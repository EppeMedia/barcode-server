var signing = require("../security/signing.js");
var encryption = require("../security/encryption.js");
var dbQueries = require("../http/dbQueries.js");
var leaseManagement = require("../user/leaseManagement.js");
var config = require("../config.js");

var exports = (module.exports = {});

exports.generateBarcodes = function (amount, callback) {
  let barcodes = [];

  for (i = 0; i < amount; i++) {
    // Random barcode of specified range (256^0 -> 256^config.barcodeSize)
    encryption.randomHex(config.barcodeSize, hex => {
      barcodes.push(hex.readUIntBE(0, config.barcodeSize));

      // If this was the last barcode we needed to generate; invoke callback
      if (barcodes.length === amount) {
        return callback(barcodes);
      }
    });
  }
};

exports.generateUniqueBarcodes = function (amount, callback, generated) {
  if (!generated) {
    generated = [];
  }

  exports.generateBarcodes(amount - generated.length, barcodes => {
    exports.barcodesExist(barcodes, (error, existingBarcodes) => {
      if (error) {
        res.status(500); // TODO: treasure hunt
        return res.send({
          message:
            "Something went wrong - could not retrieve result from database!"
        });
      }

      if (existingBarcodes && existingBarcodes.length > 0) {
        // Found existing barcodes

        const diff = barcodes.filter(barcode => {
          // Take out barcodes that alread exist in the database
          return !existingBarcodes.includes(barcode);
        });

        generated = generated.concat(diff);

        // Re-try recursively
        return generateUniqueBarcodes(amount, callback, generated);
      }

      // None of these barcodes exist; hooray!
      generated = generated.concat(barcodes);

      callback(generated);
    });
  });
};

exports.barcodesExist = function (barcodes, callback) {
  dbQueries.getBarcodes(barcodes, (error, result) => {
    const existingBarcodes = result.map(elem => {
      return parseInt(elem.barcode);
    });
    callback(error, existingBarcodes);
  });
};

exports.registerBatch = function (req, callback) {
  return new Promise(resolve => {
    if (!req) {
      // No body supplied.
      callback({ message: "Missing request body!" }, 400);
      return resolve({ message: "Missing request body!", status: 400 });
    }

    const userID = req.userID;
    if (!userID) {
      // No userID supplied.
      callback({ message: "Missing request body!" }, 400);
      return resolve({ message: "Missing request body!", status: 400 });
    }

    const leaseID = req.leaseID;
    if (!leaseID) {
      // No leaseID supplied.
      callback({ message: "Missing request body!" }, 400);
      return resolve({ message: "Missing request body!", status: 400 });
    }

    const name = req.name;
    if (!name) {
      // No name supplied.
      callback({ message: "Missing request body!" }, 400);
      return resolve({ message: "Missing request body!", status: 400 });
    }

    // Resource and description do not need to be defined
    const resource = req.resource;
    const description = req.description;

    dbQueries.registerBatch(
      userID,
      leaseID,
      resource,
      name,
      description,
      (error, results) => {
        if (error) {

          callback({ message: "Unable to register batch!" }, 500);
          return resolve({ message: "Unable to register batch!", status: 500 })
        }
        callback(false, 200, results);

        return resolve({ error: false, status: 200, batch: results });
      }
    );
  });
};

exports.getBatches = function (req, callback) {
  return new Promise(resolve => {
    if (!req) {
      // No body supplied.
      callback({ message: "Missing request body!" }, 400);
      return resolve({ message: "Missing request body!", status: 400 });
    }

    const userID = req.userID;
    if (!userID) {
      // No userID supplied.
      callback({ message: "Missing request body!" }, 400);
      return resolve({ message: "Missing request body!", status: 400 });
    }

    dbQueries.getBatches(userID, (error, results) => {
      if (error) {
        callback({ message: "Unable to get batches!" }, 500);
        return resolve({ message: "Unable to get batches!", status: 500 });
      }
      callback(false, 200, results);
      return resolve({ error: false, status: 200, batches: results })
    });
  });
};

exports.getBatch = function (req, callback) {
  if (!req) {
    // No body supplied.
    return callback({ message: "Missing request body!" }, 400);
  }
  const batchID = req.batchID;
  if (!batchID) {
    // No batchID specified
    return callback({ message: "Missing attributes!" }, 400);
  }

  dbQueries.getBatch(batchID, (error, batch) => {
    if (error) {
      return callback({ message: "Unable to get batch!" }, 500);
    }

    return callback(false, 200, batch);
  });
};

exports.registerBarcodes = function (req, callback) {
  return new Promise(resolve => {
    if (!req) {
      // No body supplied.
      callback({ message: "Missing request body!" }, 400);
      return resolve({ message: "Missing request body!", status: 400 });
    }

    const amount = req.amount;
    if (!amount) {
      // No amount supplied.
      callback({ message: "Missing attributes!" }, 400);
      return resolve({ message: "Missing attributes!", status: 400 });
    }

    const batchID = req.batchID;
    if (!batchID) {
      // No batchID supplied.
      callback({ message: "Missing attributes!" }, 400);
      return resolve({ message: "Missing attributes!", status: 400 });
    }

    const signature = req.signature;
    if (!signature) {
      // No signature supplied.
      callback({ message: "Missing attributes!" }, 400);
      return resolve({ message: "Missing attributes!", status: 400 });
    }

    const leaseID = req.leaseID;
    if (!leaseID) {
      // No lease id supplied.
      callback({ message: "Missing attributes!" }, 400);
      return resolve({ message: "Missing attributes!", status: 400 });
    }

    // Check lease validity and capacity
    leaseManagement.checkLeaseCapacity(
      leaseID,
      amount,
      (error, status, valid) => {
        if (error || !valid) {
          callback(error, status);
          resolve({ error: error, status: status, message: "Error occurred or lease invalid!" });
        }

        // Lease is valid and capacity not exceeded

        exports.generateUniqueBarcodes(amount, barcodes => {
          // Done generating unique barcodes

          // Save barcodes to database:
          dbQueries.registerBarcodes(barcodes, batchID, (error, results) => {

            if (error) {
              callback({ message: "Unable to register barcodes!" }, 500);
              return resolve({ message: "Unable to register barcodes!", status: 500 });
            }

            callback(false, 200, barcodes);
            return resolve({ error: false, status: 200, barcodes: barcodes });
          });
        });
      }
    );
  });
};
