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
const userRoutes = require('./routes/userRoutes');
const firebaseAuthRoutes = require('./routes/firebaseAuthRoutes');
const stitchRoutes = require('./routes/stitchRoutes');
const taxonomyRoutes = require('./routes/taxonomyRoutes');
const userProgressRoutes = require('./routes/userProgressRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const materialRoutes = require('./routes/materialRoutes');
const homeRoutes = require('./routes/homeRoutes');

app.use('/api/users', userRoutes);
app.use('/api/firebase-auth', firebaseAuthRoutes);
app.use('/api/stitches', stitchRoutes);
app.use('/api/taxonomy', taxonomyRoutes);
app.use('/api/progress', userProgressRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/home', homeRoutes);

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
