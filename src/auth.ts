import jwt from "jsonwebtoken";
import _ from "lodash";
import crypto from "crypto";
import passport = require("passport");
// @ts-ignore
import LocalStrategy = require("passport-local/lib/strategy");
// @ts-ignore
import JWTStrategy = require("passport-jwt/lib/strategy");
// @ts-ignore
import ExtractJWT = require("passport-jwt/lib/extract_jwt");

// passport.use(
//     new JWTStrategy(
//         {
//             secretOrKey: process.env.JWT_SECRET,
//             jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
//         },
//         async (token: { user: any }, done: Function) => {
//             try {
//                 return done(null, token.user);
//             } catch (error) {
//                 done(error);
//             }
//         }
//     )
// );

passport.use(
    "signup",
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password"
        },
        async (email: string, password: string, done: Function) => {
            try {
                const { salt, hash } = hashPassword(password);
                //Send the auth information to the next middleware
                return done(null, { email, salt, hash });
            } catch (error) {
                done(error);
            }
        }
    )
);

// TODO: This has to be updated for Mongoose
// passport.use(
//     'login',
//     new LocalStrategy(
//         {
//             usernameField: 'email',
//             passwordField: 'password'
//         },
//         async (email: string, password: string, done: Function) => {
//             try {
//                 // Find the user associated with the credentials
//                 const user = await User.where({ email }).findOne(
//                     {},
//                     { hash: 0, salt: 0 },
//                     {},
//                     (err, user) => console.log(user + 'here')
//                 );

//                 if (!user) {
//                     return done(null, false, { message: 'User not found' });
//                 } else {
//                     // Validate the password provided
//                     const isVerifiedUser = verifyPassword(password, user.salt, user.hash);

//                     if (isVerifiedUser) {
//                         return done(null, user, { message: 'User is verified' });
//                     } else {
//                         return done(null, false, { message: 'Incorrect Password' });
//                     }
//                 }
//             } catch (error) {
//                 done(error);
//             }
//         }
//     )
// );

export function hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .pbkdf2Sync(password, salt, 10000, 512, "sha512")
        .toString("hex");

    return { salt, hash };
}

export function verifyPassword(
    password: string,
    storedSalt: string,
    storedHash: string
) {
    const hash = crypto
        .pbkdf2Sync(password, storedSalt, 10000, 512, "sha512")
        .toString("hex");
    return hash === storedHash;
}

export function verifyToken(token: string) {
    return new Promise((resolve, reject) => {
        jwt.verify(
            token,
            process.env.JWT_SECRET as string,
            (err, decodedToken) => {
                if (err || !decodedToken) {
                    return reject(err);
                }

                resolve(decodedToken);
            }
        );
    });
}

export function createToken(details: {
    maxAge?: number | string;
    sessionData?: any;
    body?: any;
}) {
    if (typeof details !== "object") {
        details = {};
    }

    if (!details.maxAge || typeof details.maxAge !== "number") {
        details.maxAge = "1 day";
    }

    details.sessionData = _.reduce(
        details.sessionData || {},
        (memo, val, key) => {
            if (typeof val !== "function" && key !== "password") {
                // @ts-ignore
                memo[key] = val;
            }
            return memo;
        },
        {}
    );

    let token = jwt.sign(
        {
            data: details.sessionData,
            user: details.body
        },
        process.env.JWT_SECRET as string,
        {
            expiresIn: details.maxAge,
            algorithm: "HS256"
        }
    );

    return { val: token, expires_in: details.maxAge, issued: Date.now() };
}
