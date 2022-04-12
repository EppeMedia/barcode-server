const express = require("express");
var bodyParser = require("body-parser");
const app = express();
let cors = require("cors");
const eventBus = require("./eventBus.js");
const authorization = require("./security/authorization.js");
const userManagement = require("./user/userManagement.js");
var tokenManagement = require("./user/tokenManagement.js");
var leaseManagement = require("./user/leaseManagement.js");
var barcodeManagement = require("./barcode/barcodeManagement.js");

// Load these modules at start:
var dbQueries = require("./http/dbQueries.js");
const get = require("./get.js");

app.use(cors());
app.use(bodyParser.json());

// DON'T FORGET THE AUTHENTICATION MIDDLEWARE IN ALL USER_LOGGED_IN REQUESTS
app.get("/", authorization.checkJWTRequestHeaders, (req, res) => {
  res.status(200);
  res.send({ message: "jwt token valid!" });
});

app.post("/user/register", (req, res) => { // BUG: req type was PUT -> should be POST
  userManagement.registerUser(req, res);
});

app.post("/user/login", (req, res) => {
  userManagement.requestLogin(req.body, (error, status, user) => {
    res.status(status);
    if (error) {
      return res.send(error);
    }
    res.send({ success: true, user });
  });
});

app.put("/token/register", authorization.checkJWTRequestHeaders, (req, res) => {
  tokenManagement.registerToken(req.body, (error, status, tokenID) => {
    res.status(status);
    if (error) {
      return res.send(error);
    }
    res.send({ success: true, tokenID });
  });
});

app.get("/token/check", authorization.checkJWTRequestHeaders, (req, res) => {
  tokenManagement.checkToken(req.query, (error, status, token) => {
    res.status(status);
    if (error) {
      return res.send(error);
    }
    res.send(token);
  });
});

app.post(
  "/lease/register",
  authorization.checkJWTRequestHeaders,
  (req, res) => {
    leaseManagement.registerLease(req.body, (error, status, success) => {
      res.status(status);
      if (error) {
        return res.send(error);
      }

      let message = `Failed to register lease agreement!`;
      if (success) {
        message = `Successfully registered lease agreement!`;
      }

      res.send({
        success: true,
        message
      });
    });
  }
);

app.post(
  "/barcode/register",
  authorization.checkJWTRequestHeaders,
  (req, res) => {
    barcodeManagement.registerBarcodes(req.body, (error, status, barcodes) => {
      res.status(status);
      if (error) {
        return res.send(error);
      }

      res.send({
        success: true,
        message: `Successfully generated ${barcodes.length} barcodes!`,
        barcodes
      });
    });
  }
);

app.get("/user/batches", authorization.checkJWTRequestHeaders, (req, res) => {
  // Get all batches for a given user
  barcodeManagement.getBatches(req.query, (error, status, batches) => {
    res.status(status);
    if (error) {
      return res.send({ success: false, error });
    }

    res.send({
      success: true,
      batches
    });
  });
});

app.get("/user/tokens", authorization.checkJWTRequestHeaders, (req, res) => {
  tokenManagement.getTokens(req.query, (error, status, tokens) => {
    res.status(status);
    if (error) {
      return res.send({ success: false, error });
    }

    res.send({
      success: true,
      tokens
    });
  });
});

app.get("/token", authorization.checkJWTRequestHeaders, (req, res) => {
  tokenManagement.getToken(req.query, (error, status, token) => {
    res.status(status);
    if (error) {
      return res.send({ success: false, error });
    }

    res.send({
      success: true,
      token
    });
  });
});

app.get("/batch", authorization.checkJWTRequestHeaders, (req, res) => {
  barcodeManagement.getBatch(req.query, (error, status, batch) => {
    res.status(status);
    if (error) {
      return res.send({ success: false, error });
    }

    res.send({
      success: true,
      batch
    });
  });
});

app.post(
  "/batch/register",
  authorization.checkJWTRequestHeaders,
  (req, res) => {
    barcodeManagement.registerBatch(req.body, (error, status, results) => {
      res.status(status);
      if (error) {
        return res.send(error);
      }

      res.send({
        message: `Successfully registered batch!`
      });
    });
  }
);

// DELETE THIS; ONLY FOR TESTING PURPOSES
app.post("/sign", (req, res) => {
  const signature = require("./security/encryption.js").signMessage(
    req.body.message,
    req.body.privateKey,
    req.body.passphrase
  );
  res.status(200);
  res.send({ signature });
});

const port = 8000;
app.listen(port, () => {
  console.log(`Barcode API available on port ${port}!`);
});
