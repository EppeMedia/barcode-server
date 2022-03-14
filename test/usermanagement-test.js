// assertion
var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var jwt = require("jsonwebtoken");


//mocking
const {mockRequest, mockResponse} = require('mock-req-res');

// units
const userManagement = require('../src/user/userManagement.js');

// DB
var Pool = require("pg").Pool;
var config = require("../src/config.js");

const pool = new Pool(config.database);

describe('User management', function () {

   // making sure we are testing...
    if (!config.isTesting) {
      console.log("WARNING: ignoring attempt to run tests on non-test configuration");
      return;
    }

    it('should truncate the test database', async function () {

      // truncate database
      const result = await pool.query("truncate table public.users cascade;");

      if (result.error) {
        // could not truncate... fail tests
        it("should have truncated the database, something went wrong with the test setup. Not executing tests...", function () {
          chai.assert.equal(true, false);
        });
      }
  });

    // db truncated sucsessfully, let's test!

    describe('#registerUser()', function () {
      it('should register a user with the specified name, password and email', async function () {

          // TODO: we need a way of clearing the db every time we start the test script

          const req = mockRequest({
              body: {
                  email: 'hi@bye.com',
                  password: 'password',
                  name: 'Dirty Harry',
              },
          });

          const res = {};
          res.status = sinon.spy();
          res.send = sinon.spy();

          const result = await userManagement.registerUser(req, res, () => {});

          chai.expect(res.status).to.have.been.calledWith(200); // status OK
      });

      it('should not register a user with with an already-existing email', async function () {
  
          const req = mockRequest({
              body: {
                  email: 'hi@bye.com',
                  password: 'password',
                  name: 'Dirty Harriette',
              },
          });
  
          const res = {};
          res.status = sinon.spy();
          res.send = sinon.spy();
  
          await userManagement.registerUser(req, res, () => {});

          chai.expect(res.status).to.have.been.calledWith(400); // status not OK
      });
    });

  

    describe('#requestLogin()', function () {
      it('should log a user in with correct credentials giving a valid jwt', async function () {
  
          // TODO: we need a way of clearing the db every time we start the test script
  
          var req = mockRequest({
              body: {
                  email: 'hi@bye.com',
                  password: 'password',
              },
          });
  
  
          const result = await userManagement.requestLogin(req.body, () => {});
  
          console.log("result", result);

          chai.assert.equal(result.status, 200);//check request successful
          chai.assert.equal(result.error, false); // check no error
          chai.assert.notEqual(result.user, undefined);//check user correct
      });
    });


});