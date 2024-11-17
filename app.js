const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const path = require('path');
const passport = require('./config/passport');
const connectDB = require('./config/db');
const nocache = require('nocache');
const methodOverride = require('method-override');
// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(methodOverride('_method'));

// Connect to the database
connectDB();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.successMessage = req.flash('success');
  res.locals.errorMessage = req.flash('error');
  next();
});


app.use(nocache());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Load static assets
app.use('/public', express.static(path.join(__dirname, 'public')));
// app.use('/assets', express.static(path.join(__dirname, './public/assets')));



app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', userRoutes);

// for 404 routes
app.all('*', (req, res) => {
  res.render('partials/404');
});

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error(err.stack);
// });

app.listen(PORT,"0.0.0.0", () => console.log(`Server running on port http://localhost:${PORT}`));

