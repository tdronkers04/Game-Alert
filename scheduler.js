const { Client } = require("pg");

const today = new Date();
const year = today.getFullYear(); // 2021
const month = today.getMonth(); // zero-based index
const day = today.getDate(); // 6

const todayStart = new Date(year, month, day);
const todayEnd = new Date(year, month, day, 23);

const credentials = {
  user: "tim",
  host: "localhost",
  database: "game_alert_dev",
  port: 5432
};

async function getGames() {
  const client = new Client(credentials);
  await client.connect();
  const sql = "SELECT * FROM schedules WHERE game_date_utc > $1 AND game_date_utc < $2";

  const result = await client.query(sql, [todayStart, todayEnd]);
  await client.end();

  return result;
}

(async () => {
  const games = await getGames();
  console.log(games.rows);
})();


