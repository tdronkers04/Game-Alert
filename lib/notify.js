const { sendText, sendMail } = require("./communication-apis");
const { dbQuery } = require("./db-query");

async function getTodaysAlerts(start, end) {
  const GET_ALERTS = "SELECT s.tv_network, s.game_date_utc, t.team_name_full, u.email_address, u.sms_phone_number, a.mode" +
                  " FROM schedules AS s INNER JOIN alerts AS a ON s.home_team_id = a.team_id" +
                  " INNER JOIN teams AS t ON t.id = a.team_id  INNER JOIN users AS u ON a.user_id = u.id" +
                  " WHERE active = true AND" +
                  " game_date_utc > $1 AND game_date_utc < $2 AND" +
                  " (freq = 'all' OR (freq = 'national-only' AND national_broadcast = true))" +
                  " UNION" +
                  " SELECT s.tv_network, s.game_date_utc, t.team_name_full, u.email_address, u.sms_phone_number, a.mode" +
                  " FROM schedules AS s INNER JOIN alerts AS a ON s.away_team_id = a.team_id" +
                  " INNER JOIN teams AS t ON t.id = a.team_id INNER JOIN users AS u ON a.user_id = u.id" +
                  " WHERE active = true AND" +
                  " game_date_utc > $1 AND game_date_utc < $2 AND" +
                  " (freq = 'all' OR (freq = 'national-only' AND national_broadcast = true))";

  let result = await dbQuery(GET_ALERTS, start, end);
  if (result.rowCount === 0) return undefined;
  return result;
}

function configureDates(today) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const hour = today.getHours();
  const start = new Date(year, month, day, hour - 12);
  const end = new Date(year, month, day, hour + 12);
  return [start, end];
}

async function queryAlerts() {
  const today = new Date(); // UTC time 17:00:00 (Noon NYC)
  let [todayStart, todayEnd] = configureDates(today);
  const alerts = await getTodaysAlerts(todayStart, todayEnd);

  if (!alerts) {
    console.log("No alerts today.");
  } else {
    alerts.rows.forEach(alert => {
      if (alert.mode === 'email') {
        sendMail(alert);
      } else {
        sendText(alert);
      }
    });
  }
}

module.exports = {
  queryAlerts
};