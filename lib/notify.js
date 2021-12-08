const { sendText, sendMail } = require("./communication-apis");
const { dbQuery } = require("./db-query");

// GET INFO FOR TODAY's DATE
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();
const day = today.getDate();
const todayStart = new Date(year, month, day);
const todayEnd = new Date(year, month, day, 23);

async function getTodaysAlerts(start, end) {
  const GET_ALERTS = "SELECT s.game_date_utc, s.tv_network, a.team_id, t.team_name_full, a.user_id, a.mode, a.freq, a.active, u.email_address, u.sms_phone_number" +
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

  let result = await dbQuery(GET_ALERTS, start, end);
  if (result.rowCount === 0) return undefined;
  return result;
}

async function queryAlerts() {
  const games = await getTodaysAlerts(todayStart, todayEnd);
  if (!games) {
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
}

module.exports = {
  queryAlerts
};