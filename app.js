const express = require('express');
const app = express();

const fileRouter = require('./routes/fileRoute');
const userRouter = require('./routes/userRoute');

app.use((req,res,next)=>{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (res.method == 'OPTIONS'){
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        return res.status(200).json({});
    }
    next();
});
app.use('/file', fileRouter);
app.use('/', userRouter);

module.exports = app;