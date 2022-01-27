require('dotenv').config();
const mysql = require('mysql2');
const app = require('./app');

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
    app.locals.pool = mysql.createPool({
        connectionLimit : 10,
        user            : process.env.DB_USER,
        password        : process.env.DB_PASSWORD,
        database        : process.env.DB_NAME
      });
    app.locals.tokens = [];
});