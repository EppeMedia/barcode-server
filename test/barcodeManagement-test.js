// assertion
var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));
var jwt = require("jsonwebtoken");


//mocking
const { mockRequest, mockResponse } = require('mock-req-res');

// units
const userManagement = require('../src/user/userManagement.js');
const barcodeManagement = require('../src/barcode/barcodeManagement.js');
const leaseManagement = require('../src/user/leaseManagement.js')

// DB
var Pool = require("pg").Pool;
var config = require("../src/config.js");

const pool = new Pool(config.database);

var testUser;
var testBarcode;
var testLeaseID;
var testBatchID;

describe('Barcode management', function () {

    // making sure we are testing...
    if (!config.isTesting) {
        console.log("WARNING: ignoring attempt to run tests on non-test configuration");
        return;
    }

    it('should truncate the test database', async function () {

        // truncate database
        const result1 = await pool.query("truncate table public.users cascade;");
        const result2 = await pool.query("truncate table public.barcodes cascade;");
        const result3 = await pool.query("truncate table public.batches cascade");
        const result4 = await pool.query("truncate table public.leases cascade");

        if (result1.error || result2.error || result3.error || result4.error) {
            // could not truncate... fail tests
            it("should have truncated the database, something went wrong with the test setup. Not executing tests...", function () {
                chai.assert.equal(true, false);
            });
        }
    });


    describe('#registerBarcodes', async function () {
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

            testUser = result.user;

            chai.assert.equal(result.status, 200); //check request successful
            chai.assert.equal(result.error, false); // check no error
            chai.assert.notEqual(result.user, undefined); //check user correct
        });

        //create lease
        it("Should succesfully create a lease for our batch", async function () {
            const req = mockRequest({
                body: {
                    userID: testUser.userID,
                    capacity: 10,
                    price: 8,
                    startDate: (Date.now() / 1000),
                    endDate: (Date.now() / 1000 + 600),
                    signature: 'test'
                },
            });

            const result1 = await leaseManagement.registerLease(req.body, () => {});// create lease
            const result2 = await leaseManagement.getLeasesOfUser(testUser.userID, () => {}); // get leases for our user
            
            chai.assert.isFalse(result1.message);
            chai.assert.equal(result1.status, 200);
            chai.assert.isTrue(result1.success);

            chai.assert.equal(result2[0].user, testUser.userID);

            testLeaseID = result2[0].id;
        });

        //create batch
        it('Should succesfully create a batch for our token', async function () {
            const req1 = mockRequest({
                body: {
                    userID: testUser.userID,
                    leaseID: testLeaseID,
                    name: "test"
                },
            });

            const req2 = mockRequest({
                body: {
                    userID: testUser.userID,
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

        it('Should register 5 new barcodes', async function () {
            const req = mockRequest({
                body: {
                    signature: 'signed',
                    batchID: 0,
                    leaseID: testLeaseID,
                    batchID: testBatchID,
                    amount: 5,
                }
            });

            const res = {};
            res.status = sinon.spy();
            res.send = sinon.spy();

            const result = await barcodeManagement.registerBarcodes(req.body, () => {});

            chai.assert.equal(result.status, 200);
            chai.assert.isFalse(result.error);
            chai.assert.isDefined(result.barcodes);
            chai.assert.equal(result.barcodes.length, 5);
        });
    });
});
