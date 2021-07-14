const express = require('express')
const mongoose = require('mongoose')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const fs = require('fs')
const cors = require('cors')
require('dotenv').config()


//app 

const app = express()
const port = 5000;
// db
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mc16x.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
mongoose.connect(uri, {useNewUrlParser: true, useCreateIndex: true,
    useFindAndModify: false, useUnifiedTopology: true})

.then(() => console.log('DB CONNECTED'))
.catch(err => console.log(`DB CONNECTION ERR${err}`))

// middlewares
app.use(morgan("dev"));
app.use(bodyParser.json({limit:'2mb'}));
app.use(cors());

//routes middleware 

fs.readdirSync('./routes').map((r) =>
 app.use( '/api', require('./routes/' +r))
 )


//port 
app.listen(process.env.PORT || port,() => {
    console.log(`Example app listening at http://localhost:${port}`)
  })

