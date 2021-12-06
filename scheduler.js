const today = new Date();
const year = today.getFullYear(); // 2021
const month = today.getMonth(); // zero-based index
const day = today.getDate(); // 6
console.log(year, month, day);

const todayStart = new Date(year, month, day);
const todayEnd = new Date(year, month, day, 23);

console.log(todayStart);
console.log(todayEnd);

const sqlQuery = "SELECT * FROM schedules WHERE game_date_utc > todayStart AND game_date_utc < todayEnd";