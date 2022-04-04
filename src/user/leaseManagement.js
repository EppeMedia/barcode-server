var signing = require("../security/signing.js");
var dbQueries = require("../http/dbQueries.js");

var exports = (module.exports = {});

exports.registerLease = function (req, callback) {
  return new Promise(resolve => {
    if (!req) {
      // No body supplied.
      var res = { message: "Missing request body!", status: 400 };
      callback(res);
      return resolve(res);
    }

    const userID = req.userID;
    const capacity = req.capacity;
    const price = req.price;
    const startDate = req.startDate;
    const endDate = req.endDate;

    if (!userID || !capacity || !price || !startDate || !endDate) {
      var res = { message: "Missing attributes!", status: 400 };
      callback(res);
      return resolve(res);
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
            var res = { message: "Unable to register lease!", status: 500 };
            callback(res);
            return resolve(res);
          }

          var res = { message: false, status: 200, success: true };
          callback(false, 200, true);
          return resolve(res);
        }
      );
    });
  })
};

exports.checkLeaseCapacity = function (leaseID, amount, callback) {
  return new Promise(resolve => {
    dbQueries.getLease(leaseID, (error, lease) => {
      if (error || !lease) {
        var res = { message: "Unable to retrieve lease!", status: 500 };
        callback(res);
        return resolve(res);
      }

      // Check if lease is expired (time in Unix epoch seconds)
      const currentTime = Date.now() / 1000;
      if (currentTime >= lease.end_date) {
        var res = { message: `Lease expired at timestamp ${lease.end_date}!`, status: 400 };
        callback({ message: `Lease expired at timestamp ${lease.end_date}!` },
          400);
        return resolve(res);
      }

      // Check if the lease allows for the additional barcode capacity requested
      dbQueries.getLeaseUsage(leaseID, (error, usage) => {
        if (error || !usage) {
          var res = { message: "Unable to retrieve lease!", status: 500 };
          callback({ message: "Unable to retrieve lease!" }, 500);
          return resolve(res);
        }

        // Check if capacity is exceeded
        if (amount > lease.capacity - usage) {
          var res = { message: `Lease capacity exceeded! Capacity: ${lease.capacity}, used: ${usage}, requested: ${amount}`, status: 500 }
          callback({
            message: `Lease capacity exceeded! Capacity: ${lease.capacity}, used: ${usage}, requested: ${amount}`
          },
          500);
          return resolve(res);
        }

        // All is well
        var res = { message: false, status: 200, success: true };
        callback(false, 200, true);
        return resolve(res);
      });
    });
  })
};
