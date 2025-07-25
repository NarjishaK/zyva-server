var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var connectDB =require('./config/db')
const cors =require('cors')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var Category = require('./routes/category');
var SubCategory = require('./routes/subcategory');
var admin = require('./routes/admins')
var Attribute = require('./routes/attribute')
var product = require('./routes/product')
var warehouse = require('./routes/warehouse')
var supplier = require('./routes/supplier')
var shopping = require('./routes/shopping')
var salesorder = require('./routes/salesorder')
var customer = require('./routes/customer')
var Purchse = require('./routes/purchase')
var banner = require('./routes/banner')
var notification = require('./routes/notification')
var favorite = require('./routes/favorites')
var customercart = require('./routes/customercart')
var customerorder = require('./routes/customerorder')
var companyinfo = require('./routes/companyinfo')
var review = require("./routes/review");
var coupon = require("./routes/coupon");
var shippingtax = require("./routes/shippingtax");
var payment =require("./routes/payment")
var webhook = require("./routes/webhook")
var influencer = require("./routes/influencer")
var testimonial = require("./routes/testimonial")
connectDB()

var app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3001", "https://admin.zyva-designs.com","https://zyva-designs.com","http://zyva-designs.com","https://www.zyva-designs.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use("/webhook",webhook)
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/product', product);
app.use('/coupon',coupon);
app.use('/category', Category);
app.use('/subcategory', SubCategory);
app.use('/admin', admin);
app.use('/attribute', Attribute);
app.use('/warehouse', warehouse);
app.use('/supplier', supplier);
app.use('/shopping', shopping);
app.use('/salesorder', salesorder);
app.use('/customer', customer);
app.use('/purchase', Purchse);
app.use('/banner', banner);
app.use('/notification', notification);
app.use('/favorite', favorite);
app.use('/customercart', customercart);
app.use('/customerorder', customerorder);
app.use("/about", companyinfo);
app.use("/review",review)
app.use("/shippingtax",shippingtax)
app.use("/payment",payment)
app.use("/influencer",influencer)
app.use("/testimonial",testimonial)
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
