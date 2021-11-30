const config = require("./lib/config");
const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const store = require("connect-loki");
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
  res.locals.username = req.session.username;
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

app.get("/alerts",
  requiresAuthentication,
  catchError(async (req, res) => {
    let store = res.locals.store;
    let alerts = await store.loadAllAlerts();
    res.render("alerts", {
      alerts,
    });
  })
);

app.get("/", (req, res) => {
  res.redirect("/alerts");
});

app.get("/alert/new/league",
  requiresAuthentication,
  (req, res) => {
    res.render("new-alert-league");
  }
);

app.post("/alerts/new/league",
  requiresAuthentication,
  catchError(async (req, res) => {
    let store = res.locals.store;
    let leagueId = Number(req.body.league);

    if (!leagueId) {
      req.flash("error", "Please Select a League");
      res.render("new-alert-league");
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
      console.log(leagueTeams);
      res.render("new-alert-team", {
        leagueTeams
      });
    }
  })
);

app.post("/alerts/new/team",
  requiresAuthentication,
  catchError(async (req, res) => {
    let store = res.locals.store;
    let team = JSON.parse(req.body.team);
    let teamId = team.teamid;

    if (!teamId) {
      req.flash("error", "Please Select a Team");
      res.render("new-alert-team");
    } else {
      req.session.newTeamId = teamId;
      res.redirect("/alerts/new/preferences"); // LEFT OFF HERE :)
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

app.get("/users/signin", (req, res) => {
  req.flash("info", `Please sign in.`);
  res.render("sign-in", {
    flash: req.flash(),
  });
});

app.post("/users/signin/",
  catchError(async (req, res) => {
    let username = req.body.username.trim();
    let password = req.body.password;
    let store = res.locals.store;
    let authenticatedUser = await store.authenticateUser(username, password);

    if (authenticatedUser) {
      req.session.username = username;
      req.session.signedIn = true;
      req.flash("info", `"Welcome!`);
      res.redirect("/alerts");
    } else {
      req.flash("error", "Invalid credentials");
      res.render("sign-in", {
        flash : req.flash(),
        username : username
      });
    }
  })
);

app.post("/users/signout", (req, res) => {
  delete req.session.username;
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

app.use((err, req, res, _next) => {
  console.log(err);
  res.status(404).send(err.message);
});

app.listen(port, host, () => {
  console.log(`Game-Alert is listening on port ${port} of ${host}`);
});