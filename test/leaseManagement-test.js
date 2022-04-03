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

describe('Lease management', function () {
    // not 100% sure that this works
    util.truncateDatabase();

    const userID = 0; // assumed database to start counting from 0
    await userManagement.registerUser(
        mockRequest({ body: { email: 'hi@bye.com', password: 'password', name: 'Dirty Harry', } }),
        {status: sinon.spy, send: sinon.spy},
        util.foid
    );

    describe("#registerLease", function () {
        it("Should do some stuff", async function () {
            const req = mockRequest({
                body: {
                    userID: userID,
                    capacity: 2,
                    price: 8,
                    startDate: 'today',
                    endDate: 'tomorrow',
                    signature: 'depression'
                },
            });

            var result = {};
            var callback = function (message, status, successful) {
                result.message = message;
                result.status = status;
                result.successful = successful;
            }

            await leaseManagement.registerLease(req, callback);
            chai.assert.isFalse(result.message);
            chai.assert.equal(result.status, 200);
            chai.assert.isTrue(result.successful);
        });
    });
});