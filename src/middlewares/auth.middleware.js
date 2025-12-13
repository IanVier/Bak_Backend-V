const jwt = require('jsonwebtoken');
const usersModel = require('../models/users.model.js');

const checkToken = async (req, res, next) => {
  const auth = req.headers['authorization'];

  if (!auth) {
    return res.status(403).json({ message: 'Debes incluir el header Authorization' });
  }

  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

  if (!token) {
    return res.status(403).json({ message: 'Debes incluir el header Authorization' });
  }

  let data;
  try {
    data = jwt.verify(token, process.env.SECRET_KEY);
  } catch (error) {
    return res.status(403).json({ message: 'Token incorrecto' });
  }
  const user = await usersModel.selectById(data.userId);
  if (!user) {
    return res.status(403).json({ message: 'No existe usuario' });
  }
  req.user = user;
  next();
};

module.exports = { checkToken };
