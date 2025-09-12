const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/firebase-auth', require('./routes/firebaseAuthRoutes'));
app.use('/api/stitches', require('./routes/stitchRoutes'));
app.use('/api/taxonomy', require('./routes/taxonomyRoutes'));
app.use('/api/progress', require('./routes/userProgressRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Root route
app.get('/', (req, res) => {
  res.send('Thread Backend API is running');
});

// Serve the auth test page
app.get('/auth-test', (req, res) => {
  res.sendFile('docs/auth-test.html', { root: __dirname + '/../' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
