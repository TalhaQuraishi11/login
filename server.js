const express = require('express');
const app = express();
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDb = require('./db');
const cors = require('cors');
const bodyParser = require('body-parser'); // Import body-parser correctly
const path =require("path")
dotenv.config();

const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes');

connectDb();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Middleware
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
// Serve static files (optional, if you want to serve uploads or exports)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));


app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Hello World' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
