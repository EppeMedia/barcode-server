// assertion
var chai = require('chai');
var sinon = require('sinon');
chai.use(require('sinon-chai'));

// mocking
const { mockRequest, mockResponse } = require('mock-req-res');

// units
const encryption = require('../src/security/encryption.js');
const signing = require('../src/security/signing.js');
const userManagement = require('../src/user/userManagement.js');

// DB
var Pool = require("pg").Pool;
var config = require("../src/config.js");

const pool = new Pool(config.database);

var testUser = {};
var testPrivateKey;
var testMessage = "Hello World!";
var testSignature;

describe('Signing', function () {
    // making sure we are testing...
    if (!config.isTesting) {
        console.log("WARNING: ignoring attempt to run tests on non-test configuration");
        return;
    }

    it('should truncate the database', async function () {

        // truncate database
        const result1 = await pool.query("truncate table public.users cascade;");

        if (result1.error) {
        // could not truncate... fail tests
        it("should have truncated the database, something went wrong with the test setup. Not executing tests...", function () {
            chai.assert.equal(true, false);
        });
        }
    });

    /// prepare
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

        testPrivateKey = result.privateKey;

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

        chai.assert.equal(result.status, 200);//check request successful
        chai.assert.equal(result.error, false); // check no error
        chai.assert.notEqual(result.user, undefined);//check user correct
    });

    // end prepare

    describe("#signMessage", function () {
        it("Should sign a message for a user", function() {
            
            try {
                testSignature = encryption.signMessage(testMessage, testPrivateKey, 'my_password');
            } catch(e) {
            }
            
            chai.assert.isDefined(testSignature, 'Failed to sign message');
        });
    });

    describe("#checkSignature", function () {
        // SHOULD UPDATE 'testLeaseID' right here
        it("Should check a signature for a user", async function () {

            let result = await signing.checkSignature(testUser.userID, testMessage, testSignature ? testSignature : '', () => {});
            
            chai.assert.isTrue(result);
        });
    });
});