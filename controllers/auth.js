const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const util = require('util');
const { decode } = require("punycode");

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: process.env.PORT
});

// Login User
exports.login = async (req, res) => {
    try{
        const {email, password } = req.body;
        if( !email || !password ) {
            return res.status(400).render("login", {
                message: 'Please enter your email and password'
            });
        }

        db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
        
            if(!results[0]) {
                res.status(401).render('login', {
                    message: 'Email or Password in Incorrect'
                })
            }
            else if( !(await bcrypt.compare(password, results[0].password)) ) {
                res.status(401).render('login', {
                    message: 'Email or Password in Incorrect'
                })
            }
            else {
                const id = results[0].id;
                const token = jwt.sign({ id: id}, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES
                });
                console.log("The token is: " + token);

                const cookieOptions = {
                    expiresIn: new Date (
                        Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }

                // Put cookie in browser after successful login
                res.cookie('jwt', token, cookieOptions);
                res.status(200).redirect("/");
            }
        })

    } catch (error) {
        console.log(error)
    }
}


// Register User
exports.register = (req, res) => {
    const {email, password, passwordConfirm } = req.body;
    
    db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
        if(error) {
            console.log(error);
        }
        if( results.length > 0 ){
            return res.render('register', {
                message: 'That email has already been registered'
            })
        } else if(password !== passwordConfirm) {
            return res.render('register', {
                message: 'Passwords do not match'
            });
        }

        let encryptedPassword = await bcrypt.hash(password, 8);
        
        db.query('INSERT INTO users SET ?', {email: email, password: encryptedPassword}, (error, results) => {
            if(error) {
                console.log(error);
            } else {
                return res.render('register', {
                    success: 'User Registered'
                });
            }
        })

    });

}

// Middleware funciton to check if a user is logged in
exports.isLoggedIn = async (req, res, next) => {
    if( req.cookies.jwt ) {
        try{
            // Verify the token (tells us if the token exists, and which user it correlates to)
            const decoded = await util.promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            console.log("DECODED :");
            console.log(decoded);

            // Check if the user still exists
            db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
                //console.log(result[0]);

                if(!result[0]){
                    return next();
                }

                req.user = result[0];
                return next();
            });

        } catch(error){
            console.log(error);
            return next();
        }
    }
    else {
        next();
    }
}

exports.logout = async (req, res) => {
    //Override current cookie
    res.cookie('jwt', jwt.sign({id: 'logout'}, process.env.JWT_SECRET, {}), {
        expiresIn: new Date(Date.now() + 2 * 1000), //Expires 2 seconds after user clicks logout
        httpOnly: true
    });

    res.status(200).redirect('/');
}
