var Pool = require("pg").Pool;
var config = require("../config.js");

const pool = new Pool(config.database);

var exports = (module.exports = {});

// Adaptation of this guide on API dtabase communication: https://blog.logrocket.com/setting-up-a-restful-api-with-node-js-and-postgresql-d96d6fc892d8/

exports.registerUser = function(
  email,
  name,
  publicKey,
  passwordHash,
  callback
) {
  pool.query(
    `INSERT INTO public.users(
        email, name, public_key, password_hash)
        VALUES ('${email}', '${name}', '${publicKey}', '${passwordHash}');`,
    error => {
      if (error) {
        return callback(error);
      }

      return callback(false);
    }
  );
};

exports.getUserByID = function(id, callback) {
  pool.query(
    `SELECT * FROM public.users WHERE "id" = ${id} LIMIT 1;`,
    (error, results) => {
      let user;
      if (!error && results.rows.length > 0) {
        user = results.rows[0];
      }
      return callback(error, user);
    }
  );
};

exports.getUserByEmail = function(email, callback) {
  pool.query(
    `SELECT * FROM public.users WHERE email = '${email}' LIMIT 1;`,
    (error, results) => {
      let user;
      if (!error && results.rows.length > 0) {
        user = results.rows[0];
      }
      return callback(error, user);
    }
  );
};

exports.registerSessionToken = function(userID, token, expires, callback) {
  pool.query(
    `INSERT INTO public.sessions(
            "user", token, expires)
            VALUES ('${userID}', '${token}', '${expires}');`,
    (error, results) => {
      return callback(error, { userID, token, expires });
    }
  );
};

exports.registerToken = function(
  userID,
  token,
  expires,
  signature,
  description,
  batchPermissions,
  callback
) {
  // batchPermissions:
  // [
  //   {
  //     batchID: integer,
  //     permissions: string
  //   },
  //   ...
  // ]

  // WITH tokenID AS (
  //   insert into public.tokens ("user", "token", expires, signature, description)
  //   VALUES (8, 'abc', 25, 'Signature', 'Description')
  //   RETURNING id
  //   )
  // insert into public.permissions ("token", "batch", "permission")
  // VALUES ((SELECT "id" FROM tokenID), 1, 'rw')
  // RETURNING token;

  const queryString = `WITH tokenID AS (
    INSERT INTO public.tokens(
          "user", token,${expires ? ` expires,` : ``}${
    signature ? ` signature,` : ``
  } description)
    VALUES (${userID}, '${token}',${expires ? ` ${expires},` : ``}${
    signature ? ` '${signature}',` : ``
  } '${description}')
    RETURNING id
    )
  INSERT INTO public.permissions ("token", "batch", "permission")
  VALUES ${batchPermissions.map((batchPermission, index) => {
    return `((SELECT "id" FROM tokenID), ${batchPermission.batchID}, '${batchPermission.permissions}')`;
  })}
  RETURNING token;`;

  pool.query(queryString, (error, results) => {
    let tokenID;
    if (!error && results.rows.length > 0) {
      tokenID = results.rows[0].id;
    }
    return callback(error, tokenID);
  });
};

exports.registerLease = function(
  userID,
  capacity,
  price,
  startDate,
  endDate,
  signature,
  callback
) {
  pool.query(
    `INSERT INTO public.leases(
              "user", capacity, price, start_date, end_date, signature)
              VALUES (${userID}, ${capacity}, ${price}, ${startDate}, ${endDate}, '${signature}');`,
    (error, results) => {
      return callback(error, results);
    }
  );
};

exports.registerBarcodes = function(barcodes, batchID, callback) {
  let insert = ``;
  barcodes.map((barcode, i) => {
    insert += `(${barcode}, ${batchID})`;

    if (i !== barcodes.length - 1) {
      // Not the last element yet
      insert += `,`;
    }
  });

  const query = `INSERT INTO public.barcodes(
    barcode, batch)
    VALUES ${insert};`;

  pool.query(
    query,
    (error, results) => {
      return callback(error, results);
    }
  );
};

exports.registerBatch = function(
  userID,
  leaseID,
  resource,
  name,
  description,
  callback
) {
  pool.query(
    `INSERT INTO public.batches(
                "user", lease${resource ? `, resource` : ``}, name${
      description ? `, description` : ``
    })
                VALUES (${userID}, ${leaseID} ${
      resource ? `, ${resource}` : ``
    }, '${name}' ${description ? `, ${description}` : ``});`,
    (error, results) => {
      return callback(error, results);
    }
  );
};

exports.getBatches = function(userID, callback) {
  pool.query(
    `SELECT * FROM batches WHERE "user" = ${userID}`,
    (error, results) => {
      return callback(error, results.rows);
    }
  );
};

exports.getBatch = function(batchID, callback) {
  pool.query(
    `SELECT * FROM batches WHERE id = ${batchID}`,
    (error, results) => {
      let batch;
      if (!error && results.rows.length > 0) {
        batch = results.rows[0];
      }
      return callback(error, batch);
    }
  );
};

exports.getToken = function(tokenID, callback) {
  pool.query(
    `SELECT * FROM tokens WHERE id = '${tokenID}' LIMIT 1`,
    (error, results) => {
      let token;
      if (!error && results.rows.length > 0) {
        token = results.rows[0];
      }
      return callback(error, token);
    }
  );
};

exports.getTokens = function(userID, callback) {
  pool.query(
    `SELECT * FROM tokens WHERE "user" = ${userID}`,
    (error, results) => {
      return callback(error, results.rows);
    }
  );
};

exports.getBarcodes = function(barcodes, callback) {
  let condition = ``;
  barcodes.map((barcode, i) => {
    condition += ` barcode = '${barcode}'`;

    if (i !== barcodes.length - 1) {
      // Not the last element yet
      condition += ` OR`;
    }
  });

  const query = `SELECT barcode FROM barcodes WHERE ${condition} LIMIT ${barcodes.length}`;

  pool.query(
    query,
    (error, results) => {
      return callback(error, results ? results.rows : []);
    }
  );
};

exports.getLease = function(leaseID, callback) {
  pool.query(`SELECT * FROM leases WHERE id = ${leaseID}`, (error, results) => {
    let lease;
    if (!error && results.rows.length > 0) {
      lease = results.rows[0];
    }
    return callback(error, lease);
  });
};

exports.getLeasesByUserId = function(userID, callback) {
  pool.query(`SELECT * FROM leases WHERE leases.user = ${userID}`, (error, results) => {
    let leases;
    if (!error && results.rows.length > 0) {
      leases = results.rows;
    }
    return callback(error, leases);
  });
};

exports.getLeaseUsage = function(leaseID, callback) {
  // old query: `SELECT COUNT(*) AS usage FROM barcodes WHERE lease = ${leaseID};`
  pool.query(
    `SELECT COUNT(*)
    FROM barcodes
    INNER JOIN batches ON barcodes.batch = batches.id
    WHERE batches.lease = ${leaseID};
    `,
    (error, results) => {
      let usage;
      if (!error && results.rows.length > 0) { // bug wrong column name, new query has no alias.
        usage = results.rows[0].count;
      }
      return callback(error, usage);
    }
  );
};

exports.getPublicKey = function(userID, callback) {
  pool.query(
    `SELECT public_key FROM users WHERE id = ${userID} LIMIT 1`,
    (error, results) => {
      if (error) {
        return callback(false);
      }

      return callback(results.rows);
    }
  );
};

exports.getCredentials = function(userID) {
  pool.query(
    `SELECT password_hash, password_salt FROM users WHERE id = ${userID} LIMIT 1`,
    (error, results) => {
      if (error) {
        console.log(error);
      }

      console.log(results.rows);

      return results.rows;
    }
  );
};
