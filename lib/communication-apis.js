/*eslint-disable*/
const config = require("./config");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const OAuth2_client = new OAuth2(config.MAIL_CLIENT_ID, 
  config.MAIL_CLIENT_SECRET, config.MAIL_REDIRECT_URI);
OAuth2_client.setCredentials( { refresh_token : config.MAIL_REFRESH_TOKEN });
const twilioClient = require('twilio')(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

function sendText(alertObject) {
  let time = alertObject.game_date_utc.toLocaleTimeString('en-US', 
    {hour: '2-digit', minute:'2-digit', timeZone: 'America/New_York', timeZoneName: 'short'});
    
  twilioClient.messages.create({
    body: `GAME ALERT! The ${alertObject.team_name_full} play at ${time} on ${alertObject.tv_network}`,
    from: '+14174532888',
    to: `+1${alertObject.sms_phone_number}`,
  })
    .then( message => console.log(message))
    .catch((err) => console.log(err));
}

function getHTMLMessage(team, network, date) {
  return `
    <h3> The ${team} play at ${date.toLocaleString()} on ${network} 
  `;
}

function sendMail(alertObject) {
  const accessToken = OAuth2_client.getAccessToken();
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: config.MAIL_USER,
      clientId: config.MAIL_CLIENT_ID,
      clientSecret: config.MAIL_CLIENT_SECRET,
      refreshToken: config.MAIL_REFRESH_TOKEN,
      accessToken: accessToken,
    }
  })

  let time = alertObject.game_date_utc.toLocaleTimeString('en-US', 
    {hour: '2-digit', minute:'2-digit', timeZone: 'America/New_York', timeZoneName: 'short'});

  const mailOptions = {
    from: `Game Alert <${config.MAIL_USER}>`,
    to: alertObject.email_address,
    subject: 'GAME ALERT!',
    html: getHTMLMessage(alertObject.team_name_full, alertObject.tv_network, time),
  }

  transport.sendMail(mailOptions, function(error, result) {
    if (error) {
      console.log(`Error: `, error);
    } else {
      console.log(`Success: `, result);
    }
    transport.close();
  })
}

module.exports = {
  sendText,
  sendMail
};