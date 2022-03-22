// assertion
var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var jwt = require("jsonwebtoken");


//mocking
const {mockRequest, mockResponse} = require('mock-req-res');

// units
const userManagement = require('../src/user/tokenManagement.js');

// DB
var Pool = require("pg").Pool;
var config = require("../src/config.js");

const pool = new Pool(config.database);

describe('Token management', function () {

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

    describe('#registerToken()', function () {

        // testing three possible paths in the token/register Mealy Machine

        // register a user beforehand
        const req = mockRequest({
            body: {
                email: 'hi@bye.com',
                password: 'password',
                name: 'Dirty Harry',
            },
        });
        const res = {};
        const result = await userManagement.registerUser(req, res, () => {});

        // input check -> 400 "Bad request": some error message
        it('"input check" -> "400 Bad Request"', async function () {
            const req = mockRequest({
                body: {
                    expires: '2022-04-01',
                    userID: '0',
                    batchPermissions: 'read-write',
                }, // missing description
            });
  
            const res = {};
            res.status = sinon.spy();
            res.send = sinon.spy();
  
            const result = await tokenManagement.registerToken(req, res, () => {});
  
            chai.expect(res.status).to.have.been.calledWith(400);
            chai.assert.isDefined(result.message);
        });

        // Generate and register token -> 200 "ok": Successful token registration
        it('"input check" -> "generate & register token" -> "200 OK"', async function () {
            const req = mockRequest({
                body: {
                    expires: '2022-04-01',
                    userID: '0',
                    description: 'This is a token',
                    batchPermissions: 'read-write',
                },
            });
  
            const res = {};
            res.status = sinon.spy();
            res.send = sinon.spy();
  
            const result = await tokenManagement.registerToken(req, res, () => {});
  
            chai.expect(res.status).to.have.been.calledWith(200);
            chai.assert.equal(result.message, 'Successful token registration');
        });

        // Generate and register token -> 400 "Bad request": Unable to register token
        it('"input check" -> "generate & register token" -> "400 Bad Request"', async function () {
            const req = mockRequest({
                body: {
                    expires: '2022-04-01',
                    userID: '0',
                    description: 'This is a token',
                    batchPermissions: 'read-write',
                },
            }); // token already exists
    
            const res = {};
            res.status = sinon.spy();
            res.send = sinon.spy();
    
            const result = await tokenManagement.registerToken(req, res, () => {});
    
            chai.expect(res.status).to.have.been.calledWith(400);
            chai.assert.equal(result.message, 'Unable to register token');
        });
    })
})
