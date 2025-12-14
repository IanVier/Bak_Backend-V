const UsersModel = require('../models/users.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendVerifyEmailTo } = require('../services/email.service');

const create = async (req, res) => {
  const findEmail = await UsersModel.selectByEmail(req.body.email);
  if (findEmail) return res.status(400).json({ error: 'El email ya está registrado!' });
  req.body.password = bcrypt.hashSync(req.body.password, 8);

  try {
    const insertId = await UsersModel.insertUser(req.body);
    const newUser = await UsersModel.selectById(insertId);

    res.status(201).json({
      message: 'Usuario creado. Revisa tu correo para verificar.',
      user: newUser,
    });

    // Enviar email de verificación en segundo plano (sin bloquear la respuesta)
    sendVerifyEmailTo(newUser)
      .then((result) => {
        if (result.success) {
          console.log('✅ Email de verificación enviado a:', result.email);
        } else {
          console.warn('⚠️ Email de verificación NO enviado. Razón:', result.reason);
        }
      })
      .catch((err) => {
        console.error('❌ Error enviando email de verificación:', err.message);
      });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al insertar el nuevo usuario!' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  // ¿existe email?
  // recupero el usuario
  const user = await UsersModel.selectByEmail(email);
  if (!user) return res.status(401).json({ message: 'Error email y/o password' }); // no se pone solo email par no dar pistas (ciberseguridad)
  // ¡coinciden las passw?
  const success = bcrypt.compareSync(password, user.password);
  if (!success) return res.status(401).json({ message: 'Error email y/o password' });
  res.json({
    message: 'Login correcto!',
    token: jwt.sign({ userId: user.id_user }, process.env.SECRET_KEY),
  });
};

const verify = async (req, res) => {
  const frontendRedirectUrl = `${process.env.FRONTEND_URL || 'https://app-viajes.netlify.app'}/auth/verify`;
  const { token } = req.query;
  if (!token) {
    const errorMessage = encodeURIComponent('Falta token');
    return res.redirect(302, `${frontendRedirectUrl}?status=error&message=${errorMessage}`);
  }

  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    const userId = payload.userId;

    // Comprobar si el usuario ya existe y si ya tiene el email verificado
    const user = await UsersModel.selectById(userId);
    if (!user) {
      const errorMessage = encodeURIComponent('Usuario no encontrado');
      return res.redirect(302, `${frontendRedirectUrl}?status=error&message=${errorMessage}`);
    }

    if (!user.verified_email) {
      await UsersModel.updateEmailVerified(userId);
    }

    // Emitir token de sesión para iniciar la sesión automáticamente en el front
    const sessionToken = jwt.sign({ userId: user.id_user }, process.env.SECRET_KEY);

    const successParams = `status=success&token=${encodeURIComponent(sessionToken)}`;
    return res.redirect(302, `${frontendRedirectUrl}?${successParams}`);
  } catch (err) {
    const errorMessage = err.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';
    return res.redirect(302, `${frontendRedirectUrl}?status=error&message=${encodeURIComponent(errorMessage)}`);
  }
};

module.exports = { login, create, verify };
