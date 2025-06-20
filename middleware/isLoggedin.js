// require('dotenv').config();

// const jwt = require('jsonwebtoken');
// const Paths = [
//   '/users/signin', 
//   '/users/signup/request', 
//   '/users/signup/verify', 
//   '/users/logout'
// ];

// module.exports = function (req, res, next) {

//   const authHeader = req.headers['authorization'];

//   if (Paths.includes(req.path)) {
//     return next(); 
//   }

//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ message: 'No token provided' });
//   }

//   const token = authHeader.split(' ')[1];
//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     console.log('JWT verified successfully:', decoded);
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: 'Invalid token' });
//   }
// };



require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const allowedPaths = [
  '/users/signin',
  '/users/signup/request',
  '/users/signup/verify',
  '/users/logout',
  '/users/search'
];

module.exports = async function (req, res, next) {
  const authHeader = req.headers['authorization'];

  if (allowedPaths.includes(req.path)) {
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    console.log('User authenticated:', user.username);
    next();
  } catch (err) {
    console.error('Token error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};



// require('dotenv').config();
// const jwt = require('jsonwebtoken');

// const allowedPaths = [
//   '/users/signin',
//   '/users/signup/request',
//   '/users/signup/verify',
//   '/users/logout',
//   '/users/search'
// ];

// module.exports = function (req, res, next) {
//   const authHeader = req.headers['authorization'];

//   if (allowedPaths.includes(req.path)) {
//     return next();
//   }

//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ message: 'No token provided' });
//   }

//   const token = authHeader.split(' ')[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     if (!decoded || !decoded.id || !decoded.username) {
//       return res.status(401).json({ message: 'Invalid token payload' });
//     }

//     req.user = decoded;
//     console.log('JWT verified:', decoded);
//     next();
//   } catch (err) {
//     console.error('Token error:', err);
//     return res.status(401).json({ message: 'Invalid or expired token' });
//   }
// };

