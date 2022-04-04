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
const barcodeManagement = require('../src/barcode/barcodeManagement.js');
const leaseManagement = require('../src/user/leaseManagement.js')

// DB
var Pool = require("pg").Pool;
var config = require("../src/config.js");

const pool = new Pool(config.database);

var testuserID;
var testBatchID;
var testLeaseID;

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
        const result4 = await pool.query("truncate table public.leases cascade");

        if (result1.error || result2.error || result3.error || result4.error) {
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
        it('sign in as registered user', async function () {
  
            var req = mockRequest({
                body: {
                    email: 'hi@bye.com',
                    password: 'password',
                },
            });
    
            const result = await userManagement.requestLogin(req.body, () => {});

            testuserID = result.user.userID;

            chai.assert.equal(result.status, 200); //check request successful
            chai.assert.equal(result.error, false); // check no error
            chai.assert.notEqual(result.user, undefined); //check user correct
        });

        //create lease
        it("Should succesfully create a lease for our batch", async function () {
            const req = mockRequest({
                body: {
                    userID: testuserID,
                    capacity: 2,
                    price: 8,
                    startDate: (Date.now() / 1000),
                    endDate: (Date.now() / 1000 + 500),
                    signature: 'test'
                },
            });

            const result1 = await leaseManagement.registerLease(req.body, () => {});// create lease
            const result2 = await leaseManagement.getLeasesOfUser(testuserID, () => {}); // get leases for our user
            
            chai.assert.isFalse(result1.message);
            chai.assert.equal(result1.status, 200);
            chai.assert.isTrue(result1.success);

            chai.assert.equal(result2[0].user, testuserID);

            testLeaseID = result2[0].id;
        });

        //create batch
        it('Should succesfully create a batch for our token', async function () {
            const req1 = mockRequest({
                body: {
                    userID: testuserID,
                    leaseID: testLeaseID,
                    name: "test"
                },
            });

            const req2 = mockRequest({
                body: {
                    userID: testuserID,
                },
            });
            const result1 = await barcodeManagement.registerBatch(req1.body, () => {});
            const result2 = await barcodeManagement.getBatches(req2.body, () => {});
            
            chai.assert.equal(result1.status, 200);//check request successful
            chai.assert.equal(result1.error, false); // check no error

            chai.assert.equal(result2.status, 200);//check request successful
            chai.assert.equal(result2.error, false); // check no error
            chai.assert.notEqual(result2.batches, []); // check batches not empty
            chai.assert.notEqual(result2.batches, undefined); // check batches not undefined

            testBatchID = result2.batches[0].id;
        });



        ///End prepare

        // input check -> 400 "Bad request": some error message
        it('"input check" -> "400 Bad Request"', async function () {
            const req = mockRequest({
                body: {
                    expires: '2023-04-01',
                    userID: testuserID,
                    batchPermissions: [{
                        batchID : testBatchID,
                        permissions : 'read-write'
                    }],
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
                        batchID : testBatchID,
                        permissions : 'read-write'
                    }]
                },
            });
    
            
    
            const result = await tokenManagement.registerToken(req.body, () => {});
    
            chai.assert.equal(result.status, 200);
            chai.assert.equal(result.message, 'Successful token registration');
        });
    
        // Generate and register token -> 400 "Bad request": Unable to register token
        it('"input check" -> "generate & register token" -> "400 Bad Request"', async function () {
            const req = mockRequest({
                body: {
                    expires: '2022-04-01',
                    userID: testuserID,
                    description: 'This is a token',
                    batchPermissions: [{
                        batchID : testBatchID,
                        permissions : 'read-write'
                    }]
                },
            }); // simulate db connection failure

            const res = {};
            res.status = sinon.spy();
            res.send = sinon.spy();
            
            const result = await tokenManagement.registerToken(req.body, () => {});
    
            chai.assert.equal(result.status, 400);
            chai.assert.equal(result.message, 'Unable to register token');
        });
    });

});


