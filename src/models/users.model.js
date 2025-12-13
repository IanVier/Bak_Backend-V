const db = require('../config/db');

const selectUsers = async () => {
  const [result] = await db.query('select * from users');
  return result;
};

const selectById = async (userId) => {
  const [result] = await db.query(
    `
        select * from users
        where id_user = ?
        `,
    [userId]
  );
  if (result.length === 0) return null;
  return result[0];
};

const selectByEmail = async (email) => {
  const [result] = await db.query(
    `
        select * from users
        where email = ?
        `,
    [email]
  );
  if (result.length === 0) return null;
  return result[0];
};

const insertUser = async (userData) => {
  const { name, email, password, phone, photo_url, bio, interests, average_rating, rating_count } = userData;
  const query = `
            insert into users 
            (name, email, password, phone, photo_url, bio, interests, average_rating, rating_count) 
            values (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
  const values = [name, email, password, phone, photo_url, bio, interests, average_rating, rating_count];
  const [result] = await db.query(query, values);
  return result.insertId;
};

const updateUser = async (userId, userData) => {
  // 1. Construir la parte dinámica del SET
  const fields = [];
  const values = [];
  // Recorremos los datos que se quieren actualizar (userData = req.body)
  for (const key in userData) {
    // Ignoramos campos sensibles que deben ser tratados por separado (ej. password)
    if (userData[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(userData[key]);
    }
  }
  // Si no hay campos para actualizar, no hacemos nada
  if (fields.length === 0) return null;
  // 2. Construir la sentencia SQL completa
  // INSERTAMOS EL ID DEL USUARIO AL FINAL del array de valores para el WHERE
  values.push(userId);
  const query = `
        UPDATE users 
        SET ${fields.join(', ')} 
        WHERE id_user = ? 
    `;
  const [result] = await db.query(query, values);
  // Retornamos las filas afectadas
  return result.affectedRows;
};

const updateEmailVerified = async (userId) => {
  const query = `
            UPDATE users SET 
            verified_email = 1
            WHERE id_user = ? 
        `;
  const values = [userId];
  const [result] = await db.query(query, values);
  return result.affectedRows;
}

const updateAllUser = async (userId, userData) => {
  const { name, email, password, phone, photo_url, bio, interests, average_rating, rating_count } = userData;
  const query = `
            UPDATE users SET 
            name = ?, email = ?, password = ?, phone = ?, photo_url = ?, bio = ?, interests = ?, average_rating = ?, rating_count = ? 
            WHERE id_user = ? 
        `;
  const values = [name, email, password, phone, photo_url, bio, interests, average_rating, rating_count, userId];
  const [result] = await db.query(query, values);
  return result.affectedRows;
};

const deleteUser = async (userId) => {
  const [result] = await db.query(
    `
        delete from users where id_user = ?
        `,
    [userId]
  );
  if (result.length === 0) return null;
  return result.affectedRows === 1;
};

module.exports = { selectUsers, insertUser, selectById, selectByEmail, updateUser, updateAllUser, deleteUser , updateEmailVerified};
