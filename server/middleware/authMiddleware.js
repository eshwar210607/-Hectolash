const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header (Format: Bearer <token>)
  const authHeader = req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token against our secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data from payload to the request object
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};