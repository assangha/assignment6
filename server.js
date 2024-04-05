// Import the required modules
const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const jwt = require("jsonwebtoken");
dotenv.config();
const userService = require("./user-service.js");

const HTTP_PORT = process.env.PORT || 8080;

// Configure Passport JWT Strategy
const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
};

const jwtStrategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log('payload received', jwt_payload);

    if (jwt_payload) {
        
        const user = {
        userName: jwt_payload.userName,
        password: jwt_payload.password,
        favourites: jwt_payload.favourites,
        history: jwt_payload.history
        };
        next(null, user);
    } else {
        next(null, false);
    }
});

// Use Passport JWT Strategy
passport.use(jwtStrategy);
app.use(passport.initialize());

app.use(express.json());
app.use(cors());


app.post("/api/user/register", (req, res) => {
    userService.registerUser(req.body)
    .then((msg) => {
        res.json({ "message": msg });
    }).catch((msg) => {
        res.status(422).json({ "message": msg });
    });
});

app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body)
    .then((user) => {
        // Generate payload for JWT token
        const payload = {
            userName: user.userName,
            password: user.password
        };
        // Sign the payload to generate JWT token
        const token = jwt.sign(payload, process.env.JWT_SECRET);
        // Send the JWT token back to the client along with login success message
        res.json({ "message": "login successful", "token": token });
    }).catch(msg => {
        res.status(422).json({ "message": msg });
    });
});

// Protect routes with JWT authentication middleware
app.use("/api/user/favourites", passport.authenticate('jwt', { session: false }));
app.use("/api/user/history", passport.authenticate('jwt', { session: false }));

app.get("/api/user/favourites", (req, res) => {
    userService.getFavourites(req.user._id)
    .then(data => {
        res.json(data);
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});

app.put("/api/user/favourites/:id", (req, res) => {
    userService.addFavourite(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});

app.delete("/api/user/favourites/:id", (req, res) => {
    userService.removeFavourite(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});

app.get("/api/user/history", (req, res) => {
    userService.getHistory(req.user._id)
    .then(data => {
        res.json(data);
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })

});

app.put("/api/user/history/:id", (req, res) => {
    userService.addHistory(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});

app.delete("/api/user/history/:id", (req, res) => {
    userService.removeHistory(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});

userService.connect()
    .then(() => {
        app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
    })
    .catch((err) => {
        console.log("unable to start the server: " + err);
        process.exit();
    });
