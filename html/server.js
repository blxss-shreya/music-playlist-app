const express = require('express'); //express framework
const { request } = require('http');
const path = require('path');
const https = require('https');
const session = require('express-session');
const PORT = process.env.PORT || 3000 //allow environment variable to possible set PORT

const sqlite3 = require('sqlite3').verbose() //verbose provides more detailed stack trace
const db = new sqlite3.Database('sqlite/users.db')

const app = express()

app.use(session({
  secret: 'your_secret_key', 
  resave: false,
  saveUninitialized: true
}));

//Middleware
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(__dirname + '/public')) //static server

//set up handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

//multiple link access through rendering index.hbs
app.get(['/', '/mytunes.html', '/mytunes', '/index.html'], function(request, response) {
  if (request.session.user) {
    response.render('index'); // if logged in, render main page
  } else {
    response.render('login'); // otherwise render login page
  }
});


//Routes
//get the route for register.hbs and render it
app.get('/register', function(request, response){
  response.render('register');
});

//get the route for login.hbs and render it
app.get('/login', function(request, response){
  response.render('login');
});

app.get('/admin', function(request, response){
  if (request.session.user && request.session.user.role === 'admin') {
    db.all('SELECT userid, password, role FROM users', [], (err, rows) => {
      if (err) {
        console.error(err);
        response.status(500).send('Database error');
      } else {
        response.render('admin', { users: rows }); 
      }
    });
  } else {
    response.status(403).send('Access denied');
  }
});


// POST handler for login
app.post('/login', (request, response) => {
  const username = request.body.userid;
  const password = request.body.password;
  
  if (!username || !password) {
    // Missing fields
    return response.render('login', { error: 'Please enter both username and password.' });
  }

  db.get('SELECT * FROM users WHERE userid = ? AND password = ?', [username, password], (err, user) => {
    if (err) {
      console.error(err);
      response.status(500).send('Database error');
      return;
    }

    if (user) {
      request.session.user = user;
      if(user.role === 'admin'){
        response.redirect('/admin');
      }
      else{
        response.redirect('/');
      }
    } else {
      response.render('login', { error: 'Invalid username or password.' });
    }
  });
});



// POST handler for register
app.post('/register', (request, response) => {
  const username = request.body.userid;
  const password = request.body.password;

  if (!username || !password) {
    response.status(400).send('Please provide both a username and password.');
    return;
  }

  // Check if the username already exists
  const checkUserSql = 'SELECT * FROM users WHERE userid = ?';
  db.get(checkUserSql, [username], (err, row) => {
    if (err) {
      console.error(err);
      response.status(500).send('An error occurred while checking for existing users.');
      return;
    } else if (row) {
      // Username already exists
      response.status(409).send('Username already taken. Please choose another.');
      return;
    } else {
      // Username doesn't exist, insert the new user
      const insertUserSql = 'INSERT INTO users (userid, password, role) VALUES (?, ?, ?)';
      db.run(insertUserSql, [username, password, 'guest'], function(err) {
        if (err) {
          console.error(err);
          response.status(500).send('An error occurred while creating your account.');
          return;
        } else {
          // Registration successful
          response.render('login');
          return;
        }
      });
    }
  });
});

app.get('/songs', (request, response) => {
    let song = request.query.title
    if (!song) {
      // Send JSON response to client using response.json() feature of express
      response.json({ message: 'Please enter a song title: ' })
      return;
    }
  
    const titleWithPlusSigns = song.replace(/ /g, '+')  // Replace spaces with "+" for iTunes API
  
    const options = {
      "method": "GET",
      "hostname": "itunes.apple.com",
      "port": null,
      "path": `/search?term=${titleWithPlusSigns}&entity=musicTrack&limit=20`,
      "headers": {
        "useQueryString": true
      }
    }
  
    // Create the actual HTTP request and set up its handlers
    const apiReq = https.request(options, function (apiResponse) {
      let songData = ''
      apiResponse.on('data', function (chunk) {
        songData += chunk;
      });
      apiResponse.on('end', function () {
        // Send the response back to the client after parsing the data
        const parsedData = JSON.parse(songData);
        response.json(parsedData);
        return;
      });
    });
    apiReq.on('error', function (e) {
      console.error(e);
      response.status(500).send('Error retrieving data from iTunes API');
      return;
    });
  
    apiReq.end();
  })

  
  
//start server
app.listen(PORT, err => {
  if(err) console.log(err)
  else {
    console.log(`Server listening on http://localhost:${PORT}`)
    console.log(`To Test:`)
    console.log(`http://localhost:3000/mytunes.html`)
    console.log(`http://localhost:3000/mytunes`)
    console.log(`http://localhost:3000/`)
    console.log(`http://localhost:3000`)
  }
})

 // Important to end the request to actually send the message