// assertion
var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var jwt = require("jsonwebtoken");


//mocking
const {mockRequest, mockResponse} = require('mock-req-res');

// units
const userManagement = require('../src/user/userManagement.js');
const tokenManagement = require('../src/user/tokenManagement.js');
const barcodeManagement = require('../src/user/barcodeManagement.js');

// DB
var Pool = require("pg").Pool;
var config = require("../src/config.js");

const pool = new Pool(config.database);

var testuserID;
var testBatchID;

describe('Token management', function () {

    // making sure we are testing...
    if (!config.isTesting) {
        console.log("WARNING: ignoring attempt to run tests on non-test configuration");
        return;
      }
  
      it('should truncate the test database', async function () {
  
        // truncate database
        const result1 = await pool.query("truncate table public.users cascade;");
        const result2 = await pool.query("truncate table public.tokens cascade;");
        const result3 = await pool.query("truncate table public.batches cascade");
        if (result1.error || result2.error || result3.error) {
          // could not truncate... fail tests
          it("should have truncated the database, something went wrong with the test setup. Not executing tests...", function () {
            chai.assert.equal(true, false);
          });
        }
    });
  
      // db truncated sucsessfully, let's test!
      describe('#registerToken()', async function () {

        // testing three possible paths in the token/register Mealy Machine
    
        ///Prepare
        // register a user beforehand
        it('should register a user for our tests', async function () {
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

        // log the user in
        it('sign in as out registered user', async function () {
  
            var req = mockRequest({
                body: {
                    email: 'hi@bye.com',
                    password: 'password',
                },
            });
    
            const result = await userManagement.requestLogin(req.body, () => {});

            testuserID = result.user.userID;

            chai.assert.equal(result.status, 200);//check request successful
            chai.assert.equal(result.error, false); // check no error
            chai.assert.notEqual(result.user, undefined);//check user correct
        });

        //make batch
        it('create batch', async function () {
  
            testBatchID = result.user.userID;

            chai.assert.equal(result.status, 200);//check request successful
            chai.assert.equal(result.error, false); // check no error
            chai.assert.notEqual(result.user, undefined);//check user correct
        });
        ///End prepare

        // input check -> 400 "Bad request": some error message
        it('"input check" -> "400 Bad Request"', async function () {
            const req = mockRequest({
                body: {
                    expires: '2023-04-01',
                    userID: '0',
                    batchPermissions: 'read-write',
                }, // missing description
            });
    
    
            const result = await tokenManagement.registerToken(req.body, () => {});
            chai.assert.equal(result.status, 400);
            chai.assert.isDefined(result.message);
        });
    
        // Generate and register token -> 200 "ok": Successful token registration
        it('"input check" -> "generate & register token" -> "200 OK"', async function () {
            const req = mockRequest({
                body: {
                    expires: '2022-04-01',
                    userID: testuserID,
                    description: 'This is a token',
                    batchPermissions: [{
                        // also need a batch
                        batchID : '0',
                        permissions : 'read-write'
                    }]
                },
            });
    
            
    
            const result = await tokenManagement.registerToken(req.body, () => {});
    
            // chai.assert.equal(result.status, 200);
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
    
            const result = await tokenManagement.registerToken(req.body, () => {});
    
            chai.expect(res.status).to.have.been.calledWith(400);
            chai.assert.equal(result.message, 'Unable to register token');
        });
    });

});


