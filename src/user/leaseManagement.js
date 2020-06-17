var signing = require("../security/signing.js");
var dbQueries = require("../http/dbQueries.js");

var exports = (module.exports = {});

exports.registerLease = function(req, callback) {
  if (!req) {
    // No body supplied.
    return callback({ message: "Missing request body!" }, 400);
  }

  const userID = req.userID;
  if (!userID) {
    // No userID supplied.
    return callback({ message: "Missing attributes!" }, 400);
  }

  const capacity = req.capacity;
  if (!capacity) {
    return callback({ message: "Missing attributes!" }, 400);
  }

  const price = req.price;
  if (!price) {
    return callback({ message: "Missing attributes!" }, 400);
  }

  const startDate = req.startDate;
  if (!startDate) {
    return callback({ message: "Missing attributes!" }, 400);
  }

  const endDate = req.endDate;
  if (!endDate) {
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
          return callback({ message: "Unable to register lease!" }, 500);
        }

        return callback(false, 200, true);
      }
    );
  });

  // Check signature
  // const signatureBuffer = Buffer.from(signature, "hex");
  // const message = `${userID}${capacity}${price}${startDate}${endDate}`;
  // signing.checkSignature(userID, message, signatureBuffer, valid => {
  //   if (valid) {
  //     // Store lease

  //     dbQueries.registerLease(
  //       userID,
  //       capacity,
  //       price,
  //       startDate,
  //       endDate,
  //       signature,
  //       (error, results) => {
  //         if (error) {
  //           return callback({ message: "Unable to register lease!" }, 500);
  //         }

  //         return callback(false, 200, true);
  //       }
  //     );
  //   } else {
  //     callback(
  //       { message: "Invalid signature; unable to register lease!" },
  //       400
  //     );
  //   }
  // });
};

exports.checkLeaseCapacity = function(leaseID, amount, callback) {
  dbQueries.getLease(leaseID, (error, lease) => {
    if (error || !lease) {
      return callback({ message: "Unable to retrieve lease!" }, 500);
    }

    // Check if lease is expired (time in Unix epoch seconds)
    const currentTime = Date.now() / 1000;
    if (currentTime >= lease.end_date) {
      return callback(
        { message: `Lease expired at timestamp ${lease.end_date}!` },
        400
      );
    }

    // Check if the lease allows for the additional barcode capacity requested
    dbQueries.getLeaseUsage(leaseID, (error, usage) => {
      if (error || !usage) {
        return callback({ message: "Unable to retrieve lease!" }, 500);
      }

      // Check if capacity is exceeded
      if (amount > lease.capacity - usage) {
        return callback(
          {
            message: `Lease capacity exceeded! Capacity: ${lease.capacity}, used: ${usage}, requested: ${amount}`
          },
          500
        );
      }

      // All is well
      callback(false, 200, true);
    });
  });
};
