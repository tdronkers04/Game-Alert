const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.email = session.email;
  }

  async authenticateUser(email, password) {
    const FIND_HASHED_PASSWORD = "SELECT * FROM users WHERE email_address = $1";
    let result = await dbQuery(FIND_HASHED_PASSWORD, email);
    if (result.rowCount === 0) return false;
    return bcrypt.compare(password, result.rows[0].password);
  }

  async createNewUser(reqBody) {
    const INSERT_NEW_USER = "INSERT INTO users" +
                            " (email_address, sms_phone_number, password)" +
                            " VALUES ($1, $2, $3)";

    let { email, phone, password } = reqBody;
    let hashedPassword = await bcrypt.hash(password, 10);
    let cleanPhone = phone.replaceAll("-", "");

    let resultNewUser = await dbQuery(INSERT_NEW_USER,
      email, cleanPhone, hashedPassword);

    if (resultNewUser.rowCount === 0) return false;

    return true;
  }

  _sortAlerts(alerts) {
    let active = [];
    let inactive = [];

    alerts.forEach(alert => {
      if (alert.active) {
        active.push(alert);
      } else {
        inactive.push(alert);
      }
    });
    return active.concat(inactive);
  }

  async loadAllAlerts() {
    const ALL_ALERTS = "SELECT a.id, t.team_name_full, a.mode, a.freq, a.active" +
                       " FROM alerts AS a" +
                       " INNER JOIN teams AS t ON t.id = a.team_id" +
                       " INNER JOIN users AS u ON u.id = a.user_id" +
                       " WHERE u.email_address = $1";
    let resultAllAlerts = await dbQuery(ALL_ALERTS, this.email);
    if (!resultAllAlerts) return undefined;
    return this._sortAlerts(resultAllAlerts.rows);
  }

  async loadAlert(alertId) {
    const FIND_ALERT = "SELECT a.id, t.team_name_full, a.mode, a.freq, a.active" +
                       " FROM alerts AS a" +
                       " INNER JOIN teams AS t ON t.id = a.team_id" +
                       " INNER JOIN users AS u ON u.id = a.user_id" +
                       " WHERE u.email_address = $1 AND a.id = $2";

    let resultAlert = await dbQuery(FIND_ALERT, this.email, alertId);
    if (!resultAlert) return undefined;
    return resultAlert.rows[0];
  }

  async deleteAlert(alertId) {
    const DELETE_ALERT = "DELETE FROM alerts WHERE id = $1";
    let resultDelete = await dbQuery(DELETE_ALERT, alertId);
    if (!resultDelete) return undefined;
    return resultDelete.rowCount > 0;
  }

  async deactivateAlert(alertId) {
    const DEACTIVATE_ALERT = "UPDATE alerts SET active = NOT active WHERE id = $1";
    let resultDeactivate = await dbQuery(DEACTIVATE_ALERT, alertId);
    if (!resultDeactivate) return undefined;
    console.log(resultDeactivate);
    return resultDeactivate.rowCount > 0;
  }

  async retrieveTeams(leagueId) {
    const FIND_TEAMS = "SELECT id AS teamId, team_name_full FROM teams WHERE league_id = $1";
    let resultRetrieveTeams = await dbQuery(FIND_TEAMS, leagueId);
    if (!resultRetrieveTeams) return undefined;
    return resultRetrieveTeams.rows;
  }

  async addNewAlert(teamId, mode, freq) {
    const ADD_ALERT = "INSERT INTO alerts (team_id, user_id, mode, freq)" +
                      " VALUES ($2, (SELECT id FROM users WHERE email_address = $1), $3, $4)";
    let resultAddAlert = await dbQuery(ADD_ALERT,
      this.email, teamId, mode, freq);

    if (!resultAddAlert) return undefined;
    return resultAddAlert.rowCount > 0;
  }

  clearSessionData(session) {
    delete session.newLeagueId;
    delete session.newTeamName;
    delete session.newTeamId;
  }
};