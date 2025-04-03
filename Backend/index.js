import express from 'express';
import db from './db/db.js';
import dotenv from 'dotenv';

const app = express();

app.get('/test', (req, res) => {
  res.json('Hello World!');
});

app.post('/register', (req, res) => {
  const { username, password } = req.body;
  res.json({ message: 'User registered successfully', username });  
});
app.listen(3000, () => {
  db();
  console.log('Server is running on port 3000');
});
