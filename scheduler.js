const { config } = require("dotenv");
const { Client } = require("pg");

require('dotenv').config();
const accountSid = config.TWILIO_ACCOUNT_SID;
const authToken = config.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

function twilioAPICALL(alertObject) {
  client.messages.create({
    body: `GAME ALERT! ${alertObject.team_name_full} play tonight on ${alertObject.tv_network}`,
    from: '+14174532888',
    to: `+1${alertObject.sms_phone_number}`,
  })
    .then( message => console.log(message))
    .catch((err) => console.log(err));
}

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
  const games = await getGames();
  games.rows.forEach(game => {
    console.log(game);
    twilioAPICALL(game);
  });
})();

