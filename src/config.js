module.exports = {
  jwtSecret: "3D4B2499B55EE9AEBD46B29F09D7D6A665FB7D91AFCE99E3C82EA1D07FB3837C",
  jwtMinLifespan: 3600,
  jwtMaxLifespan: 86400,
  tokenSize: 48,
  barcodeSize: 3,
  rsaModulusLength: 4096,
  database: {
    user: "postgres",
    host: "localhost",
    database: "public",
    password: "postgres",
    port: 5432
  }
};
