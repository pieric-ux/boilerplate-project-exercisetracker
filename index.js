const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const MONGO_URI = process.env['MONGO_URI']
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

// Middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())
app.use(express.static('public'))

// MongoDB Configuration
mongoose.connect(MONGO_URI)
    .catch(err => console.error(err));
mongoose.connection
  .on('error', err => console.error(err));

const UserSchema = new mongoose.Schema({
  username: String,
  exercises: [
    {
      description: String,
      duration: Number,
      date: Date
    }
  ]
});

const User = mongoose.model('UserModel', UserSchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', (req, res) => {
  User.find({}, 'username _id')
    .then( (response) => {
      res.json(response);
    })
    .catch( (err) => console.error(err));
});

app.post('/api/users', (req, res) => {
  const username = req.body.username;
  User.create({ username: username })
    .then((response) => {
      res.json({ username: response.username, _id: response._id });
    })
    .catch((err) => console.error(err));
});

app.post('/api/users/:user_id/exercises', (req, res) => {
  const userId = req.params.user_id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date ? new Date(req.body.date) : new Date();

  User.findById(userId)
    .then((response) => {
      response.exercises.push({
        description: description,
        duration: duration,
        date: date
      });
      response.save()
        .then((response) => {    
          res.json({ 
            _id: userId, 
            username: response.username, 
            date: date.toDateString(), 
            duration: parseInt(duration), 
            description: description });
        })
        .catch((err) => console.error(err));
    })
    .catch((err) => console.error(err));
});

app.get('/api/users/:user_id/logs', (req, res) => {
  const userId = req.params.user_id;
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null ;
  const limit = req.query.limit ? req.query.limit : null;

  User.findById(userId)
    .then((response) => {
      let log = response.exercises;
      let json = {};
      json._id = response._id;
      json.username = response.username;
      if(from) {
        log = log.filter((exercise) => {
          return exercise.date >= from;
        });
        json.from = from.toDateString();
      }
      if(to) {
        log = log.filter((exercise) => {
          return exercise.date <= to;
        });
        json.to = to.toDateString();
      }
      if(limit) {
        log = log.slice(0, limit);
      }
      json.count = log.length;
      json.log = log.map((exercise) => {
        return {
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString()
        }
      });
      res.json(json);
    })
    .catch((err) => console.error(err));
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
