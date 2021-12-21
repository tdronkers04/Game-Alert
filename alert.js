/* eslint-disable no-unused-vars*/
const config = require("./lib/config");
const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const store = require("connect-loki");
const { CronJob } = require("cron");
const { queryAlerts } = require("./lib/notify");
const PgPersistence = require("./lib/pg-persistence");
const catchError = require("./lib/catch-error");

const app = express();
const host = config.HOST;
const port = config.PORT;
const LokiStore = store(session);

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000, // 31 days in milliseconds
    path: "/",
    secure: false,
  },
  name: "Game Alert App",
  resave: false,
  saveUninitialized: true,
  secret: config.SECRET,
  store: new LokiStore({}),
}));

app.use(flash());
app.use((req, res, next) => {
  res.locals.email = req.session.email;
  res.locals.signedIn = req.session.signedIn;
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});

const requiresAuthentication = (req, res, next) => {
  if (!res.locals.signedIn) {
    res.redirect(302, "/users/signin");
  } else {
    next();
  }
};

app.get("/", (req, res) => {
  res.redirect("/welcome");
});

app.get("/welcome", (req, res) => {
  res.render("welcome");
});

app.get("/alerts",
  requiresAuthentication,
  catchError(async (req, res) => {
    let store = res.locals.store;
    store.clearSessionData(req.session);
    let alerts = await store.loadAllAlerts();
    res.render("alerts", {
      alerts,
    });
  })
);

app.get("/alerts/new/league",
  requiresAuthentication,
  (req, res) => {
    res.render("new-alert-league");
  }
);

app.post("/alerts/new/league",
  requiresAuthentication,
  catchError((req, res) => {
    let leagueId = Number(req.body.league);

    if (!leagueId) {
      req.flash("error", "Please Select a League");
      res.render("new-alert-league", {
        flash : req.flash(),
      });
    } else {
      req.session.newLeagueId = leagueId;
      res.redirect("/alerts/new/team");
    }
  })
);

app.get("/alerts/new/team",
  requiresAuthentication,
  catchError(async (req, res) => {
    let store = res.locals.store;
    let leagueId = req.session.newLeagueId;

    if (!leagueId) {
      throw new Error("Not Found.");
    } else {
      let leagueTeams = await store.retrieveTeams(leagueId);
      res.render("new-alert-team", {
        leagueTeams
      });
    }
  })
);

app.post("/alerts/new/team",
  requiresAuthentication,
  catchError((req, res) => {
    let team = req.body.team ? JSON.parse(req.body.team) : undefined;

    if (!team) {
      req.flash("error", "Please Select a Team");
      res.redirect("/alerts/new/team");
    } else {
      req.session.newTeamId = team.teamid;
      req.session.newTeamName = team.team_name_full;
      res.redirect("/alerts/new/preferences");
    }
  })
);

app.get("/alerts/new/preferences",
  requiresAuthentication,
  catchError((req, res) => {
    let teamName = req.session.newTeamName;
    if (!teamName) {
      throw new Error("Not Found.");
    } else {
      res.render("new-alert-preferences", {
        teamName
      });
    }
  })
);

app.post("/alerts/new/preferences",
  requiresAuthentication,
  catchError(async (req, res) => {
    let store = res.locals.store;
    let newFreq = req.body.frequency;
    let newComm = req.body.commPref;

    if (!newFreq || !newComm) {
      req.flash("error", "Please Select Your Preferences");
      res.redirect("/alerts/new/preferences");
    } else {
      let newTeamId = req.session.newTeamId;
      let addedAlert = await store.addNewAlert(newTeamId, newComm, newFreq);

      if (!addedAlert) {
        req.flash("error", "Please try again");
        res.redirect("/alerts/new/preferences");
      }
      req.flash("success", "Alert added.");
      res.redirect("/alerts");
    }
  })
);

app.get("/alert/:alertId",
  requiresAuthentication,
  catchError(async (req, res) => {
    let store = res.locals.store;
    let alertId = Number(req.params.alertId);
    let alert = await store.loadAlert(alertId);

    if (!alert) {
      throw new Error("Not Found.");
    } else {
      res.render("alert", {
        alert
      });
    }
  })
);

app.get("/users/register", (req, res) => {
  req.flash("info", `Please register an account to continue.`);
  res.render("register", {
    flash: req.flash(),
  });
});

app.post("/users/register",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address."),
    body("phone")
      .trim()
      .matches(/^\d\d\d-\d\d\d-\d\d\d\d$/)
      .withMessage("Invalid phone number format. Use ###-###-####"),
    body("password")
      .trim()
      .isLength({ min: 5, max: 25 })
      .withMessage("Password must be between 5 and 25 characters long."),
    body("passwordConfirm")
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      })
  ],
  catchError(async (req, res) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(error => req.flash("error", error.msg));
      res.render("register", {
        flash: req.flash()
      });
    } else {
      let store = res.locals.store;
      let createdUser = await store.createNewUser(req.body);

      if (createdUser) {
        req.flash("success", "New Account Created. Please sign in.");
        res.render("sign-in", { flash : req.flash() });
      } else {
        req.flash("error", "Something went wrong...");
        res.render("register", { flash : req.flash() });
      }
    }
  })
);

app.get("/users/signin", (req, res) => {
  req.flash("info", `Please sign in.`);
  res.render("sign-in", {
    flash: req.flash(),
  });
});

app.post("/users/signin/",
  catchError(async (req, res) => {
    let email = req.body.email.trim();
    let password = req.body.password;
    let store = res.locals.store;
    let authenticatedUser = await store.authenticateUser(email, password);

    if (authenticatedUser) {
      req.session.email = email;
      req.session.signedIn = true;
      req.flash("info", `Welcome!`);
      res.redirect("/alerts");
    } else {
      req.flash("error", "Invalid credentials");
      res.render("sign-in", {
        flash : req.flash(),
        email : email
      });
    }
  })
);

app.post("/users/signout", (req, res) => {
  delete req.session.email;
  delete req.session.signedIn;
  res.redirect("/users/signin");
});

app.post("/alert/:alertId/destroy",
  requiresAuthentication,
  catchError(async (req, res) => {
    let store = res.locals.store;
    let alertId = Number(req.params.alertId);
    let deletedAlert = await store.deleteAlert(alertId);

    if (!deletedAlert) {
      throw new Error("Not Found.");
    } else {
      req.flash("success", `Alert has been deleted.`);
    }
    res.redirect(`/alerts`);
  })
);

app.post("/alert/:alertId/deactivate",
  requiresAuthentication,
  catchError(async (req, res) => {
    let store = res.locals.store;
    let alertId = Number(req.params.alertId);
    let deactivatedAlert = await store.deactivateAlert(alertId);
    let loadedAlert = await store.loadAlert(alertId);

    if (!deactivatedAlert) {
      throw new Error("Not Found.");
    } else {
      req.flash("success",
        `Alert has been ${loadedAlert.active ? 'Activated' : 'Deactivated'}.`);
    }
    res.redirect(`/alerts`);
  })
);

app.use((err, req, res, _next) => {
  console.log(err);
  res.status(404).send(err.message);
});

app.listen(port, host, () => {
  console.log(`Game-Alert is listening on port ${port} of ${host}`);
});


// EVERY DAY AT NOON EST:
const getDailyAlerts = new CronJob(
  '0 12 * * *',
  queryAlerts,
  null,
  false,
  'America/New_York',
);

// TEST
// const getDailyAlerts = new CronJob(
//   '*/1 * * * *',
//   queryAlerts,
//   null,
//   false,
//   'America/New_York',
// );

getDailyAlerts.start();