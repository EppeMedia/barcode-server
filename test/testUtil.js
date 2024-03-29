// // assertion
// var chai = require('chai');
// var sinon = require('sinon');
// chai.use(require('sinon-chai'));

// // DB
// var Pool = require("pg").Pool;
// var config = require("../src/config.js");

// const pool = new Pool(config.database);

// var exports = (module.exports = {});

// // call this at the top of your test
// exports.truncateDatabase = function () {
//   // making sure we are testing...
//   if (!config.isTesting) {
//     console.log("WARNING: ignoring attempt to run tests on non-test configuration");
//     return;
//   }

//   it('should truncate the enitre test database', function () {
//     truncateTables(['public.users', 'public.leases', 'public.batches', 
//     'public.tokens', 'public.sessions', 'public.permissions', 'public.barcodes']);
//   });
// }

// exports.truncateTables = function (tables) {
//   tables.forEach(table => this.truncateTable(table));
// }

// exports.truncateTable = function (table) {
//   // making sure we are testing...
//   if (!config.isTesting) {
//     console.log("WARNING: ignoring attempt to run tests on non-test configuration");
//     return;
//   }

//   it(`Should truncate the test database table ${table}`, async function () {

//     // truncate database
//     const result = await pool.query(`truncate table ${table} cascade;`);

//     if (result.error) {
//       // could not truncate... fail tests
//       it(`should have truncated the database table ${table}, something went wrong with the test setup. Not executing tests...`, function () {
//         chai.assert.equal(true, false);
//       });
//     }
//   });
// }

// // can be used as argument to callback for the functions
// exports.foid = function () {

// }