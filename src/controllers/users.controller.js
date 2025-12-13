const pool = require('../config/db');
const UsersModel = require('../models/users.model');
const bcrypt = require('bcryptjs');

const getAll = async (req, res) => {
  try {
    const users = await UsersModel.selectUsers();
    res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener todos los usuarios.' });
  }
};

const getById = async (req, res) => {
  const { userId } = req.params;
  const user = await UsersModel.selectById(userId);
  //delete user.password; // Mario recomienda no enviar la pass aunque esté encriptada. Comento la linea hasta que averiguemos como modificar el usuario por completo de una manera segura
  if (!user) return res.status(404).json({ message: 'Id Usuario no existe' });
  res.json(user);
};

const getByEmail = async (req, res) => {
  const { email } = req.params;
  const user = await UsersModel.selectByEmail(email);
 // delete user.password;
  if (!user) return res.status(404).json({ message: 'Email incorrecto o no existe' });
  res.json(user);
};

const update = async (req, res) => {
    try {
        const { userId } = req.params;
        const userData = req.body; 
        if (userData.password) {
            const user = await UsersModel.selectById(userId);
            if (!user) {
                return res.status(404).json({ message: 'Id de Usuario no existe' });
            }
            const isSame = await bcrypt.compare(userData.password, user.password);
            if (isSame) {
                return res.status(400).json({ message: 'Contraseña igual a la anterior' });
            }
            const salt = await bcrypt.genSalt(10);
            userData.password = await bcrypt.hash(userData.password, salt);
        }
        const affectedRows = await UsersModel.updateUser(userId, userData);
        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Id de Usuario no existe o no hay campos para modificar' });
        }
        const userModified = await UsersModel.selectById(userId);
       // delete userModified.password; 
        res.json(userModified);
    } catch (error) {
        console.error('Error al modificar el usuario:', error);
        return res.status(500).json({ error: 'Error interno al modificar el usuario!' });
    }
};

const updateAllUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const userData = req.body;

        if (userData.password) {
            const user = await UsersModel.selectById(userId);
            if (!user) return res.status(404).json({ message: 'Id de Usuario no existe o no hay campos para modificar' });
            
            const isMatch = await bcrypt.compare(userData.password, user.password);

            if (isMatch) {
                userData.password = user.password;
            } else {
                const salt = await bcrypt.genSalt(10);
                userData.password = await bcrypt.hash(userData.password, salt);
            }
        }

        const affectedRows = await UsersModel.updateAllUser(userId, userData);

        if (affectedRows === 0) return res.status(404).json({ message: 'Id de Usuario no existe o no hay campos para modificar' });
        
        const userModified = await UsersModel.selectById(userId);
        //delete userModified.password;
        res.json(userModified);

    } catch (error) {
        console.error('Error al modificar el usuario:', error);
        return res.status(500).json({ error: 'Error interno al modificar el usuario!' });
    }
};

const remove = async (req, res) => {
  try {
    const { userId } = req.params;
    const success = await UsersModel.deleteUser(userId);
    if (!success) return res.status(404).json({ message: 'Id de Usuario no existe' });
    res.json({ message: `El usuario con id [${userId}] ha sido eliminado con éxito.` });
  } catch (error) {
    console.error('Error en controlador remove:', error);
    return res.status(500).json({ error: 'Error interno al eliminar el usuario' });
  }
};

module.exports = { getAll, getById, getByEmail, remove, update, updateAllUser };
