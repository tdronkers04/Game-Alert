const { Client } = require("pg");
const { sendText, sendMail } = require("./communication-apis");

// GET INFO FOR TODAY's DATE
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();
const day = today.getDate();
const todayStart = new Date(year, month, day);
const todayEnd = new Date(year, month, day, 23);

const credentials = {
  user: "tim",
  host: "localhost",
  database: "game_alert_dev",
  port: 5432
};

async function getTodaysAlerts() { // replace with dbQuery call
  const client = new Client(credentials);
  await client.connect();
  const sqlHOME = "SELECT s.game_date_utc, s.tv_network, a.team_id, t.team_name_full, a.user_id, a.mode, a.freq, a.active, u.email_address, u.sms_phone_number" +
                  " FROM schedules AS s INNER JOIN alerts AS a ON s.home_team_id = a.team_id" +
                  " INNER JOIN teams AS t ON t.id = a.team_id" +
                  " INNER JOIN users AS u ON a.user_id = u.id" +
                  " WHERE active = true AND" +
                  " game_date_utc > $1 AND game_date_utc < $2" +
                  " UNION" +
                  " SELECT s.game_date_utc, s.tv_network, a.team_id, t.team_name_full, a.user_id, a.mode, a.freq, a.active, u.email_address, u.sms_phone_number" +
                  " FROM schedules AS s INNER JOIN alerts AS a ON s.away_team_id = a.team_id" +
                  " INNER JOIN teams AS t ON t.id = a.team_id" +
                  " INNER JOIN users AS u ON a.user_id = u.id" +
                  " WHERE active = true AND" +
                  " game_date_utc > $1 AND game_date_utc < $2";

  const result = await client.query(sqlHOME, [todayStart, todayEnd]);
  await client.end();

  return result;
}
(async () => {
  let result = await getTodaysAlerts();
  console.log(result.rows);
})();

(async () => {
  const games = await getTodaysAlerts();
  if (games.rowCount === 0) {
    console.log("No alerts today.");
  } else {
    games.rows.forEach(game => {
      if (game.mode === 'email') {
        sendMail(game);
      } else if (game.mode === 'sms') {
        sendText(game);
      }
    });
  }
})();

