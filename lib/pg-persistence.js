const { dbQuery } = require("./db-query");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
    this.newAlertInfo = {leagueId: null, teamId: null};
  }

  async authenticateUser(username, password) {
    const FIND_HASHED_PASSWORD = "SELECT * FROM users WHERE username = $1"; // to-do: convert passwords to hash
    let result = await dbQuery(FIND_HASHED_PASSWORD, username);
    if (result.rowCount === 0) return false;
    return result.rows[0].password === password;
    // return bcrypt.compare(password, result.rows[0].password);
  }

  async loadAllAlerts() {
    const ALL_ALERTS = "SELECT a.id, t.team_name_full, a.mode, a.freq, a.active" +
                       " FROM alerts AS a" +
                       " INNER JOIN teams AS t ON t.id = a.team_id" +
                       " INNER JOIN users AS u ON u.id = a.user_id" +
                       " WHERE u.username = $1";
    let resultAllAlerts = await dbQuery(ALL_ALERTS, this.username);

    if (!resultAllAlerts) return undefined;

    return resultAllAlerts.rows;
  }

  async loadAlert(alertId) {
    const FIND_ALERT = "SELECT a.id, t.team_name_full, a.mode, a.freq, a.active" +
                       " FROM alerts AS a" +
                       " INNER JOIN teams AS t ON t.id = a.team_id" +
                       " INNER JOIN users AS u ON u.id = a.user_id" +
                       " WHERE u.username = $1 AND a.id = $2";

    let resultAlert = await dbQuery(FIND_ALERT, this.username, alertId);

    if (!resultAlert) return undefined;

    return resultAlert.rows[0];
  }

  async deleteAlert(alertId) {
    const DELETE_ALERT = "DELETE FROM alerts WHERE id = $1";
    let resultDelete = await dbQuery(DELETE_ALERT, alertId);

    if (!resultDelete) return undefined;

    return resultDelete.rowCount > 0;
  }

  async retrieveTeams(leagueId) {
    const FIND_TEAMS = "SELECT id AS teamId, team_name_full FROM teams WHERE league_id = $1";
    let resultRetrieveTeams = await dbQuery(FIND_TEAMS, leagueId);

    if (!resultRetrieveTeams) return undefined;

    return resultRetrieveTeams.rows;
  }

};