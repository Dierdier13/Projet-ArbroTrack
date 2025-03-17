const express = require("express");
const session = require('express-session');
const flash = require('connect-flash');
const userRouter = require("./router/userRouter");
const propertyRouter = require("./router/propertyRouter");
const sectorRouter = require("./router/sectorRouter");
const treeRouter = require("./router/treeRouter");
const historyRouter = require("./router/historyRouter");
const commentRouter = require("./router/commentRouter");

const app = express();

app.use(express.static("./public"));
app.use('/uploads', express.static('./uploads'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'yolo',
  resave: true,
  saveUninitialized: true
}));

app.use((req, res, next) => {
  if (req.method === 'GET') {
    req.session.previousUrl = req.session.currentUrl;
    req.session.currentUrl = req.originalUrl;
  }
  next();
});

// app.use((req, res, next) => {
//   if (req.accepts('json')) {
//     res.status(404).json({ error: 'Route not found' });
//   } else {
//     res.status(404).send('<h1>Page not found</h1>');
//   }
// });

app.use(flash());
app.use((req, res, next) => {
  res.locals.flash = req.flash();
  next();
});

app.use(userRouter);
app.use(propertyRouter);
app.use(sectorRouter);
app.use(treeRouter);
app.use(historyRouter);
app.use(commentRouter);

app.listen(3002, () => {
  console.log("Écoute sur le port 3002");
})