const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const chalk = require('chalk');
const cors = require('cors');
const helmet = require('helmet');

const keys = require('./config/keys');
const routes = require('./routes');
const socket = require('./socket');
const setupDB = require('./utils/db');

const { port } = keys;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: true
  })
);
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://alphaaccessoriesbd.com',
    'https://www.alphaaccessoriesbd.com',
    'http://alphaaccessoriesbd.com',
    'http://www.alphaaccessoriesbd.com'
  ],
  credentials: true
}));

setupDB();
require('./config/passport')(app);
app.use(routes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/dist'); // Adjust the path to your React build folder
  app.use(express.static(buildPath));

  // Serve index.html for all unmatched routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const server = app.listen(port, () => {
  console.log(
    `${chalk.green('✓')} ${chalk.blue(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  );
});

socket(server);
