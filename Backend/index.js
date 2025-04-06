import express from 'express';
import db from './db/db.js';
import User from './models/user.model.js';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import {WebSocketServer} from 'ws';
import Message from './models/message.model.js';
import ImageKit from 'imagekit';

dotenv.config();
const app = express();
app.use(cors({origin:process.env.CLIENT_URL,credentials:true}));
app.use(express.json())
app.use(cookieParser())


const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function authenticateToken(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, {}, async (err, userData) => {
        if (err) {
          reject('Unauthorized');
        } else {
          resolve(userData); 
        }
      });
    } else {
      reject('Unauthorized');
    }
  });
}

function showOnlinePeople(onlinePeople){
  [...wss.clients].forEach(client => {
    client.send(JSON.stringify({
        online: onlinePeople,
      }
    ));
  });
}

app.get('/test', (req, res) => {
  res.json('Hello World!');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdUser = await User.create({ 
      username:username, 
      password:hashedPassword,
    });
    jwt.sign({ userId:createdUser._id, username }, process.env.JWT_SECRET,{},(err,token) => {
      if (err) {
        return res.status(500).json({ error: 'Error generating token' });
      }
      res.cookie('token', token, { httpOnly: true });
      res.status(201).json({ message: 'User registered successfully' });
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({username});
  if(foundUser){
    const isPasswordCorrect = await bcrypt.compare(password, foundUser.password);
    if (isPasswordCorrect) {
      jwt.sign({ userId:foundUser._id, username }, process.env.JWT_SECRET, {}, (err, token) => {
        if (err) return res.status(500).json({ error: 'Error generating token' });
        res.cookie('token', token, { httpOnly: true });
        res.json(foundUser);
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }}
});

app.post('/logout', (req, res) => {
  res.cookie('token', '', { expires: new Date(0) });
  res.json({ message: 'Logged out successfully' });
});

app.get('/profile', (req, res) => {
  const token = req.cookies?.token;
  if(token){
    jwt.verify(token, process.env.JWT_SECRET, {}, async (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  }else{
    res.status(401).json({ error: 'Unauthorized' });
  }
  
});

app.get('/people', async (req, res) => {
  const users = await User.find({}, {'_id':1,username:1});
  res.json(users);
});

app.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const userData = await authenticateToken(req);
  const messages = await Message.find({
    $or: [
      { sender: userData.userId, recipient: userId },
      { sender: userId, recipient: userData.userId }
    ]
  })
  res.json(messages);
});

const server = app.listen(3000, () => {
  db();
  console.log('Server is running on port 3000');
});

const wss = new WebSocketServer({ server });
wss.on('connection', (connection,req) => {
  connection.isAlive = true;
  
  connection.timer = setInterval(() => {
    connection.ping();
    connection.death = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      showOnlinePeople();
    },1000);
  },5000);

  connection.on('pong', () => {
    clearTimeout(connection.death);
  });

  const cookies = req.headers.cookie;
  if(cookies){
    const token = cookies.split('; ').find(row => row.startsWith('token=')).split('=')[1];
    if(token){
      jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
        if (err) throw err;
        const {userId, username} = userData;
        connection.userId = userId; 
        connection.username = username;
      });
    }
  }

  connection.on('message', async (message) => {
    const messageData = JSON.parse(message.toString());
    const {recipient, text, file, tempId} = messageData;
    let fileUrl = null;
    
    if(file) {
      try {
        const base64Data = file.data.split(',')[1];
        const fileName = `chat_${Date.now()}_${file.name}`;
        
        const uploadResponse = await imagekit.upload({
          file: base64Data,
          fileName: fileName,
          folder: '/chat-uploads'
        });
        
        fileUrl = uploadResponse.url;
      } catch (error) {
        console.error('Error uploading to ImageKit:', error);
      }
    }
    
    if(recipient && (text || fileUrl)) {
      const messageDocument = await Message.create({
        sender: connection.userId,
        recipient: recipient,
        text: text || '',
        file: fileUrl
      });
      
      [...wss.clients].forEach(client => {
        if(client.userId === recipient){
          client.send(JSON.stringify({
            sender: connection.userId,
            text,
            file: fileUrl,
            _id: messageDocument._id,
            recipient,
          }));
        }
      });
      
      [...wss.clients].forEach(client => {
        if(client.userId === connection.userId){
          client.send(JSON.stringify({
            sender: connection.userId,
            text,
            file: fileUrl,
            _id: messageDocument._id,
            recipient,
            tempId,
          }));
        }
      });
    }
  });

  showOnlinePeople();
});

wss.on('close', (connection) => {
  [...wss.clients].forEach(client => {
    client.send(JSON.stringify({
      online: [...wss.clients].map(c => ({userId:c.userId, username:c.username})),
    }));
  });
});

wss.on('error', (error) => {
  console.error('WebSocket error:', error);
});