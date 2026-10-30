// core module
const path = require('path');
const fs = require('fs');

// External module
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const { default: mongoose } = require('mongoose');
const multer = require('multer');
const cors = require('cors');

const DB_PATH = 'mongodb+srv://yogitabeniwal83_db_user:mongodb123@interview-ai-cluster.ypkhoom.mongodb.net/?appName=Interview-ai-cluster';

// local module
const storeRouter = require("./routes/storeRouter")
const hostRouter = require("./routes/hostRouter")
const authRouter = require("./routes/authRouter");
const bookingRouter = require("./routes/bookingRouter");
const rootDir = require('./utils/pathUtil');
const errorsControllers = require('./controllers/errors');

 
const app = express();
const uploadDir = path.join(__dirname, '../uploads');
const legacyUploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.get("/test", (req, res) => {
  res.send("My Express App Working");
});


const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions'
});

const randomString = (length) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for(let i=0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    cb(null, randomString(10) + '-' + file.originalname); 
  }
});

const fileFilter = (req, file, cb) => {
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const multerOptions = {
  storage,
  fileFilter
};

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const uploadPhoto = multer(multerOptions).single('photo');

app.use((req, res, next) => {
  uploadPhoto(req, res, (error) => {
    if (!error) {
      return next();
    }

    console.error('IMAGE UPLOAD ERROR:', error);
    return res.status(error instanceof multer.MulterError ? 400 : 500).json({
      success: false,
      message: 'Unable to upload image',
    });
  });
});
app.use(express.static(path.join(rootDir, 'public')));
app.use('/uploads', express.static(uploadDir));

// Keep files created by the previous Backend/src/uploads configuration readable.
if (fs.existsSync(legacyUploadDir)) {
  app.use('/uploads', express.static(legacyUploadDir));
}
app.use(session({
  secret: 'my secret key', // This is a secret key used to sign the session ID cookie, it should be a long and random string in a real application
  resave: false, // This option saves the session even if nothing changed. Setting it to false avoids unnecessary saves and improves performance.
  saveUninitialized: false, // This option saves even new (unmodified) sessions to storage. It can help with login handling, saving server space, or meeting rules that require user permission before setting cookies.
  store: store,  // We are using MongoDB to store our sessions, we are creating a new instance of MongoDBStore and passing the DB_PATH and collection name where we want to store our sessions. This will allow us to persist our sessions in the database, so even if the server restarts, the sessions will still be available
    cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Using Cookie
// app.use((req, res, next) => {
//   req.isLoggedIn = req.get('Cookie') ? req.get('Cookie').split('=')[1] === 'true' : false; // we are checking if the cookie isLoggedIn is set to true or not, if it is set to true, then we set req.isLoggedIn to true, otherwise we set it to false, this req.isLoggedIn will be used in our controllers to check if the user is logged in or not
//   next();
// })

// Using Session middleware
app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn; // Saves session even if unchanged; false improves performance by avoiding extra saves.
  next();
})


app.use(authRouter);
app.use(storeRouter);
app.use(bookingRouter);

app.use(hostRouter);

app.use(errorsControllers.pageNotFound);


const PORT = Number(process.env.AIRBNB_PORT || process.env.PORT) || 4000;

mongoose.connect(DB_PATH).then(() => {
  console.log('Connected to Mongo');
  
  app.listen(PORT, () => {
  console.log(`Server running on address http://localhost:${PORT}`);
});
}).catch(err => {
  console.log('Error while connecting to Mongo:', err); 
}) 
