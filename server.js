const app = require('./src/app');
const { sequelize } = require('./src/models');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Sync database and start listening
sequelize.sync()
  .then(() => {
    console.log('Database connection synced successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
      console.log(`Access the store at: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect or sync the database:', err.message);
    process.exit(1);
  });
