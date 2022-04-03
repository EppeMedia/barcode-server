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

      it('should not register a user with an already-existing email', async function () {
  
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

      it('should not register a user with no request body', async function () {
  
        const req = mockRequest();

        const res = {};
        res.status = sinon.spy();
        res.send = sinon.spy();

        await userManagement.registerUser(req, res, () => {});

        chai.expect(res.status).to.have.been.calledWith(400); // status not OK
    });

    it('should not register a user with no email in request body', async function () {
  
      const req = mockRequest({body: {
        password: 'password',
        name: 'Dirty Harry',
    },});

      const res = {};
      res.status = sinon.spy();
      res.send = sinon.spy();

      await userManagement.registerUser(req, res, () => {});

      chai.expect(res.status).to.have.been.calledWith(400); // status not OK
   });

   it('should not register a user with no password in request body', async function () {
  
    const req = mockRequest({body: {
      email: 'h1@bye.com',
      name: 'Dirty Harry',
  },});

    const res = {};
    res.status = sinon.spy();
    res.send = sinon.spy();

    await userManagement.registerUser(req, res, () => {});

    chai.expect(res.status).to.have.been.calledWith(400); // status not OK
    });

  it('should not register a user with no name in request body', async function () {
  
    const req = mockRequest({body: {
      email: 'h1@bye.com',
      password: 'password',
  },});

    const res = {};
    res.status = sinon.spy();
    res.send = sinon.spy();

    await userManagement.registerUser(req, res, () => {});

    chai.expect(res.status).to.have.been.calledWith(400); // status not OK
    });
  
  });

    describe('#requestLogin()', function () {
      it('should log a user in with correct credentials', async function () {
  
          var req = mockRequest({
              body: {
                  email: 'hi@bye.com',
                  password: 'password',
              },
          });
  
          const result = await userManagement.requestLogin(req.body, () => {});

          chai.assert.equal(result.status, 200);//check request successful
          chai.assert.equal(result.error, false); // check no error
          chai.assert.notEqual(result.user, undefined);//check user correct
      });

      it('should not log a user in with incorrect password', async function () {
  
          var req = mockRequest({
              body: {
                  email: 'hi@bye.com',
                  password: 'passwords', // bad password
              },
          });
  
          const result = await userManagement.requestLogin(req.body, () => {});

          chai.assert.equal(result.status, 400);//check request unsuccessful
      });

      it('should not log a user in with non-existing email', async function () {
  
        var req = mockRequest({
            body: {
                email: 'hi@bae.com', // bad email
                password: 'password',
            },
        });

        const result = await userManagement.requestLogin(req.body, () => {});
        
        chai.assert.equal(result.status, 400);//check request unsuccessful
      });

      it('should not log a user in with no request body', async function () {
  
        var req = mockRequest();

        const result = await userManagement.requestLogin(req.body, () => {});
        
        chai.assert.equal(result.status, 400);//check request unsuccessful
      });

      it('should not log a user in with missing password', async function () {
  
        var req = mockRequest({
          body: {
            email: 'hi@bye.com',
            // missing password
          }
        });

        const result = await userManagement.requestLogin(req.body, () => {});
        
        chai.assert.equal(result.status, 400);//check request unsuccessful
      });

      it('should not log a user in with missing email', async function () {
  
        var req = mockRequest({
          body: {
            // missing email
            password: 'password',
          }
        });

        const result = await userManagement.requestLogin(req.body, () => {});
        
        chai.assert.equal(result.status, 400);//check request unsuccessful
      });
    });
        // //STUB Test cases
    
        // describe('#createOrganization()', function() {
        //   it('should create an organization for the logged in user', async function(){
        //     var req = mockRequest({
        //       body: {
        //         name: 'John Wick',
        //         permissions: 'read-write',
        //       }
        //     });
    
        //     const result = await userManagement.createOrganization(req, () => {});
        //     chai.assert.equal(result.status, 200);
        //     chai.assert.isDefined(result.organization, 'function should contain a field for organization which is the unique identifier');
        //   });
    
        //   it('should not create an organization for the logged in user because of an already-existing organization', async function() {
        //     var req = mockRequest({
        //       body: {
        //         name: 'John Wick',
        //         permissions: 'read-write',
        //       }
        //     });
    
        //     const result = await userManagement.createOrganization(req, () => {});
        //     chai.assert.equal(result.status, 400);
        //     chai.assert.isUndefined(result.organization, 'function should NOT contain a field for organization which is the unique identifier');
        //   });
    
        //   it('Creating an organization with only read permissions is not allowed', async function() {
        //     var req = mockRequest({
        //       body: {
        //         name: 'John Wick',
        //         permissions: 'read'
        //       }
        //     });
    
        //     const result = await userManagement.createOrganization(req, () => {});
        //     chai.assert.equal(result.status, 400);
        //     chai.assert.equal(result.error, true);
        //   });
        // });
    
        // describe('#updateOrganization()', function() {
        //   it('update an organization to add a new member', async function() {
        //     var req = mockRequest({
        //       body: {
        //         name: 'John Wick',
        //         permissions: 'read',
        //         member: 'Ian McShane'
        //       }
        //     });
    
        //     const result = await userManagement.updateOrganization(req, () => {});
        //     chai.assert.equal(result.status, 200);
        //     chai.assert.equal(result.error, false);
        //   });
    
        //   it('update an organization to remove a member', async function() {
        //     var req = mockRequest({
        //       body: {
        //         name: 'John Wick',
        //         member: 'Ian McShane'
        //       }
        //     });
    
        //     const result = await userManagement.updateOrganization(req, () => {});
        //     chai.assert.equal(result.status, 200);
        //     chai.assert.equal(result.error, false);
        //   });
    
        //   it('Updating an organization that does not exist should throw an error', async function() {
        //     var req = mockRequest({
        //       body: {
        //         name: 'Keanu Reeves',
        //         member: 'Winston',
        //         permissions: 'read-write',
        //       }
        //     });
    
        //     const result = await userManagement.createOrganization(req, () => {});
        //     chai.assert.equal(result.status, 400);
        //     chai.assert.equal(result.error, true);
        //   });
    
        //   it('Updating an organization with a member that does not exist should throw an error', async function() {
        //     var req = mockRequest({
        //       body: {
        //         name: 'John Wick',
        //         permissions: 'read-write',
        //         member: 'Alfie Allen'
        //       }
        //     });
    
        //     const result = await userManagement.createOrganization(req, () => {});
        //     chai.assert.equal(result.status, 400);
        //     chai.assert.equal(result.error, true);
        //   });
    
        //   // NOTE TODO: this requires the user to be logged in as a member without proper read/write permissions
        //   it('Updating an organization as a member without write permissions should throw an error', async function() {
        //     var req = mockRequest({
        //       body: {
        //         name: 'John Wick',
        //         member: 'Keanu Reeves'
        //       }
        //     });
    
        //     const result = await userManagement.createOrganization(req, () => {});
        //     chai.assert.equal(result.status, 400);
        //     chai.assert.equal(result.error, true);
        //   });
        // });
    
        // describe('#deleteOrganization()', function() {
        //   it('Deleting an organization', async function() {
        //     var req = mockRequest({
        //       body: {
        //         name: 'John Wick',
        //       }
        //     });
    
        //     const result = await userManagement.deleteOrganization(req, () => {});
        //     chai.assert.equal(result.status, 200);
        //     chai.assert.equal(result.error, false);
        //   });
    
        //   it('Deleting an organization that does not exist should throw an error', async function() {
        //     var req = mockRequest({
        //       body: {
        //         name: 'Keanu Reeves',
        //       }
        //     });
    
        //     const result = await userManagement.deleteOrganization(req, () => {});
        //     chai.assert.equal(result.status, 400);
        //     chai.assert.equal(result.error, true);
        //   });
        // });
});