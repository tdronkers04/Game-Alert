const config = require("./config");
const { Client } = require("pg");

const logQuery = (statement, parameters) => {
  let timeStamp = new Date();
  let formattedTimeStamp = timeStamp.toString().substring(4, 24);
  console.log(formattedTimeStamp, statement, parameters);
};

const isProduction = (config.NODE_ENV === "production");

const CONNECTION = {
  connectionString: config.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
};

module.exports = {
  async dbQuery(statement, ...queryValues) {
    let client = new Client(CONNECTION);

    await client.connect();
    logQuery(statement, queryValues);
    let result = await client.query(statement, queryValues);
    await client.end();

    return result;
  }
};