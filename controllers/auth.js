const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: process.env.PORT
});

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
