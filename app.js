const express = require("express");
const path = require("path");
const mysql = require("mysql");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

dotenv.config({ path: './.env'});
const app = express();

const db = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.DB_USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: process.env.PORT
});

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

app.set('view engine', 'hbs');

db.connect((error) => {
    if(error) {
        console.log(error)
    } else {
        console.log("Successfully connected to database")
    }
})

app.use(express.urlencoded({extended: false}));
app.use(express.json());

//Used for setting up cookies in the browser
app.use(cookieParser());

app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.listen(3010, () => {
    console.log("Server started on port 3010")
})
