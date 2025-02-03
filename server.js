/* eslint-disable no-undef */
import mongoose from 'mongoose';
import { app } from './src/app.js';

const PORT = process.env.PORT || 8080;

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

let server;

// const privatekey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

// Move uncaught exception handler to top
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 🔥 Shutting down...');
  console.log(err.name, err.message);
  console.log(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  // Only shutdown for non-operational errors
  if (!err.isOperational) {
    console.log('UNHANDLED REJECTION! 🔥 Shutting down...');
    console.log(err.name, err.message);
    if (server) {
      server.close(() => {
        console.log('Server closed');
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  }
  // For operational errors, let the global error handler deal with it
  console.log('Operational error caught:', err.name, err.message);
});

// Server + mongoose
mongoose
  .connect(DB)
  .then(() => {
    console.log('Database connected !🌴');
    server =
      // https
      //   .createServer({ key: privatekey, cert: certificate }, app)
      app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
  })
  .catch((err) => {
    console.log('Error connecting to database 🔥');
    console.log(err.name, err.message);
    process.exit(1);
  });
