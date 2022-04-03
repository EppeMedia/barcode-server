// assertion
var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));



//mocking
const { mockRequest, mockResponse } = require('mock-req-res');

// units
const leaseManagement = require('../src/user/leaseManagement.js');

const util = require('./testUtil.js');
const userManagement = require('../src/user/userManagement.js');

var testuserID;
var testLeaseID = 0;
var testExpiredLeaseID = 0;

describe('Lease management', function () {
    util.truncateDatabase();

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

        const result = await userManagement.registerUser(req, res, () => { });

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

        const result = await userManagement.requestLogin(req.body, () => { });

        testuserID = result.user.userID;

        chai.assert.equal(result.status, 200);//check request successful
        chai.assert.equal(result.error, false); // check no error
        chai.assert.notEqual(result.user, undefined);//check user correct
    });

    describe("#registerLease", function () {
        // SHOULD UPDATE 'testLeaseID' right here
        it("Should succesfully register a lease", async function () {
            const req = mockRequest({
                body: {
                    userID: testuserID,
                    capacity: 2,
                    price: 8,
                    startDate: (Date.now() / 1000),
                    endDate: (Date.now() / 1000 + 500),
                    signature: 'depression'
                },
            });

            const result = await leaseManagement.registerLease(req, util.foid);
            chai.assert.isFalse(result.message);
            chai.assert.equal(result.status, 200);
        });

        it("Should succesfully register a lease even without signature", async function () {
            // SHOULD UPDATE 'testExpiredLeaseID' right here
            const req = mockRequest({
                body: {
                    userID: testuserID,
                    capacity: 2,
                    price: 8,
                    startDate: (Date.now() / 1000 - 5),
                    endDate: (Date.now() / 1000 - 4)
                },
            });

            const result = await leaseManagement.registerLease(req, util.foid);
            chai.assert.isNull(result.message);
            chai.assert.equal(result.status, 200);
        });

        it("Should be rejected due to missing capacity attribute", async function() {
            // missing capacity
            const req = mockRequest({
                body: {
                    userID: testuserID,
                    price: 8,
                    startDate: (Date.now() / 1000),
                    endDate: (Date.now() / 1000 + 500),
                    signature: 'depression'
                },
            });

            const result = await leaseManagement.registerLease(req, util.foid);
            chai.assert.isNotEmpty(result.message);
            chai.assert.equal(result.status, 400);
        });

        it("Should be rejected due to missing capacity attribute", async function () {
            const req = mockRequest({
                body: {
                    userID: testuserID,
                    capacity: 2,
                    price: 8,
                    startDate: (Date.now() / 1000),
                    endDate: (Date.now() / 1000 + 500),
                    signature: 'depression'
                },
            });

            const result = await leaseManagement.registerLease(req, util.foid);
            chai.assert.isNotEmpty(result.message);
            chai.assert.equal(result.status, 400);
        });

        it("Should be rejected due to missing userID attribute", async function () {
            const req = mockRequest({
                body: {
                    capacity: 2,
                    price: 8,
                    startDate: (Date.now() / 1000),
                    endDate: (Date.now() / 1000 + 500),
                    signature: 'depression'
                },
            });

            const result = await leaseManagement.registerLease(req, util.foid);
            chai.assert.isNotEmpty(result.message);
            chai.assert.equal(result.status, 400);
        });

        it("Should be rejected due to missing price attribute", async function () {
            const req = mockRequest({
                body: {
                    userID: testuserID,
                    capacity: 2,
                    startDate: (Date.now() / 1000),
                    endDate: (Date.now() / 1000 + 500),
                    signature: 'depression'
                },
            });

            const result = await leaseManagement.registerLease(req, util.foid);
            chai.assert.isNotEmpty(result.message);
            chai.assert.equal(result.status, 400);
        });

        it("Should be rejected due to missing startDate attribute", async function () {
            const req = mockRequest({
                body: {
                    userID: testuserID,
                    capacity: 2,
                    price: 8,
                    endDate: (Date.now() / 1000 + 500),
                    signature: 'depression'
                },
            });

            const result = await leaseManagement.registerLease(req, util.foid);
            chai.assert.isNotEmpty(result.message);
            chai.assert.equal(result.status, 400);
        });

        it("Should be rejected due to missing endDate attribute", async function () {
            const req = mockRequest({
                body: {
                    userID: testuserID,
                    capacity: 2,
                    price: 8,
                    startDate: (Date.now() / 1000),
                    signature: 'depression'
                },
            });

            const result = await leaseManagement.registerLease(req, util.foid);
            chai.assert.isNotEmpty(result.message);
            chai.assert.equal(result.status, 400);
        });

        it("Should be rejected due to missing endDate attribute", async function () {
            const req = mockRequest({
                body: {
                    userID: testuserID,
                    capacity: 2,
                    price: 8,
                    startDate: (Date.now() / 1000),
                    signature: 'depression'
                },
            });

            const result = await leaseManagement.registerLease(req, util.foid);
            chai.assert.isNotEmpty(result.message);
            chai.assert.equal(result.status, 400);
        });
    });

    describe("#checkLeaseCapacity", function() {
        it("Should succeed with amount of 1", async function() {
            const result = await leaseManagement.checkLeaseCapacity(testLeaseID, 1, util.foid);
            chai.assert.isNull(result.message);
            chai.assert.equal(result.status, 200);
        });

        it("Should fail with amount of 3", async function() {
            const result = await leaseManagement.checkLeaseCapacity(testLeaseID, 3, util.foid);
            chai.assert.isNotEmpty(result.message);
            chai.assert.equal(result.status, 500);
        });

        it("Should return that the provided lease has expired", async function() {
            const result = await leaseManagement.checkLeaseCapacity(testExpiredLeaseID, 3, util.foid);
            chai.assert.isNotEmpty(result.message);
            chai.assert(result.message.contains('expire'));
            chai.assert.equal(result.status, 400);
        });

        it("Should fail because provided lease ID does not exist", async function() {
            var id = 7 + 3 * testLeaseID + 283 * testExpiredLeaseID; // randomly create an ID
            const result = await leaseManagement.checkLeaseCapacity(id, 1, util.foid);
            chai.assert.isNotEmpty(result.message);
            chai.assert.equal(result.status, 500);
        });
    });
});