var signing = require("../security/signing.js");
var dbQueries = require("../http/dbQueries.js");

var exports = (module.exports = {});

exports.registerLease = function (req, callback) {
  return new Promise(resolve => {
    if (!req) {
      // No body supplied.
      resolve({ message: "Missing request body!" }, 400);
      return callback({ message: "Missing request body!" }, 400);
    }

    const userID = req.userID;
    const capacity = req.capacity;
    const price = req.price;
    const startDate = req.startDate;
    const endDate = req.endDate;

    if (!userID || !capacity || !price || !startDate || !endDate) {
      resolve({ message: "Missing attributes!" }, 400);
      return callback({ message: "Missing attributes!" }, 400);
    }

    const signature = req.signature;
    if (!signature) {
      console.warn("Warn: Issuing lease without signature!");
      signature = "signature_placeholder";
    }

    dbQueries.getUserByID(userID, (error, user) => {
      dbQueries.registerLease(
        userID,
        capacity,
        price,
        startDate,
        endDate,
        signature,
        (error, results) => {
          if (error) {
            resolve({ message: "Unable to register lease!" }, 500);
            return callback({ message: "Unable to register lease!" }, 500);
          }

          resolve(false, 200, true);
          return callback(false, 200, true);
        }
      );
    });
  })
};

exports.checkLeaseCapacity = function (leaseID, amount, callback) {
  return new Promise(resolve => {
    dbQueries.getLease(leaseID, (error, lease) => {
      if (error || !lease) {
        resolve({ message: "Unable to retrieve lease!" }, 500);
        return callback({ message: "Unable to retrieve lease!" }, 500);
      }

      // Check if lease is expired (time in Unix epoch seconds)
      const currentTime = Date.now() / 1000;
      if (currentTime >= lease.end_date) {
        resolve({ message: `Lease expired at timestamp ${lease.end_date}!` }, 400);
        return callback({ message: `Lease expired at timestamp ${lease.end_date}!` }, 400);
      }

      // Check if the lease allows for the additional barcode capacity requested
      dbQueries.getLeaseUsage(leaseID, (error, usage) => {
        if (error || !usage) {
          resolve({ message: "Unable to retrieve lease!" }, 500);
          return callback({ message: "Unable to retrieve lease!" }, 500);
        }

        // Check if capacity is exceeded
        if (amount > lease.capacity - usage) {
          resolve({message: `Lease capacity exceeded! Capacity: ${lease.capacity}, used: ${usage}, requested: ${amount}`}, 500);
          return callback({message: `Lease capacity exceeded! Capacity: ${lease.capacity}, used: ${usage}, requested: ${amount}`}, 500);
        }

        // All is well
        resolve(false, 200, true);
        callback(false, 200, true);
      });
    });
  })
};
