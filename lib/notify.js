// const { sendText, sendMail } = require("./communication-apis");
const { dbQuery } = require("./db-query");

// GET INFO FOR TODAY's DATE
const today = new Date(); // UTC time 17:00:00 (Noon NYC)
const year = today.getFullYear();
const month = today.getMonth();
const day = today.getDate();
const hour = today.getHours();
const todayStart = new Date(year, month, day, hour - 12); // UTC 05:00 same day (Midnight NYC)
const todayEnd = new Date(year, month, day, hour + 12); // UTC 05:00 next day (Midnight NYC)

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

async function queryAlerts() {
  const alerts = await getTodaysAlerts(todayStart, todayEnd);
  console.log(`today => ${today}`);
  console.log(`year => ${year}`);
  console.log(`month => ${month}`);
  console.log(`day => ${day}`);
  console.log(`hour => ${hour}`);
  console.log(`todayStart => ${todayStart}`);
  console.log(`todayEnd => ${todayEnd}`);

  alerts.rows.forEach(row => {
    console.log(`alert => ${JSON.stringify(row)}`);
  });

  // if (!alerts) {
  //   console.log("No alerts today.");
  // } else {
  //   alerts.rows.forEach(alert => {
  //     if (alert.mode === 'email') {
  //       sendMail(alert);
  //     } else {
  //       sendText(alert);
  //     }
  //   });
  // }
}

module.exports = {
  queryAlerts
};