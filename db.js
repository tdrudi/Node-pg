/** Database setup for BizTime. */



const { Client } = require("pg");

let client = new Client({
  connectionString: "postgresql://tdrudi:password@127.0.0.1:5432/biztime"
});

client.connect();

module.exports = client;