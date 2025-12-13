// Define your model here
const db = require('../config/db');

// Obtener una participacion por id
const selectParticipationById = async (participationId) => {
  const [result] = await db.query(
    `
      SELECT *
      FROM trip_participants
      WHERE id_participation = ?
    `,
    [participationId]
  );

  if (result.length === 0) return null;
  return result[0];
};

// Participantes/solicitudes de un viaje (con status opcional)
const selectParticipantsByTrip = async (tripId, status) => {
  let sql = `
    SELECT *
    FROM trip_participants
    WHERE id_trip = ?
  `;
  const values = [tripId];

  if (status) {
    sql += ' AND status = ?';
    values.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const [result] = await db.query(sql, values);
  return result;
};

// Solicitudes donde YO soy el SOLICITANTE ( con status opcional)
const selectMyRequests = async (userId, status) => {
  let sql = `
    SELECT *
    FROM trip_participants
    WHERE id_user = ?
  `;
  const values = [userId];

  if (status) {
    sql += ' AND status = ?';
    values.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const [result] = await db.query(sql, values);
  return result;
};

// Solicitudes de TODOS los viajes que yo(el usuario) he creado (CREADOR)
const selectMyCreatorRequests = async (userId, status) => {
  let sql = `
    SELECT p.*
    FROM trip_participants p
    JOIN trips t ON t.id_trip = p.id_trip
    WHERE t.id_creator = ?
  `;
  const values = [userId];

  if (status) {
    sql += ' AND p.status = ?';
    values.push(status);
  }

  sql += ' ORDER BY p.created_at DESC';

  const [result] = await db.query(sql, values);
  return result;
};

//  Comprobar si ya existe participación para un par viaje/usuario
const selectByTripAndUser = async (tripId, userId) => {
  const [result] = await db.query(
    `
      SELECT *
      FROM trip_participants
      WHERE id_trip = ? AND id_user = ?
    `,
    [tripId, userId]
  );

  if (result.length === 0) return null;
  return result[0];
};

//  Insertar/create una nueva participación/solicitud
const insertParticipation = async (tripId, userId, message, status = 'pending') => {
  const query = `
    INSERT INTO trip_participants (id_trip, id_user, message, status)
    VALUES (?, ?, ?, ?)
  `;
  const values = [tripId, userId, message || null, status];

  const [result] = await db.query(query, values);
  return result.insertId;
};

// Actualizar/update estado de una participación/solicitud
const updateParticipationStatus = async (participationId, status) => {
  const correctStatus = ['pending', 'accepted', 'rejected', 'left'];
  if (!correctStatus.includes(status)) {
    const err = new Error('Invalid status');
    err.code = 'INVALID_STATUS';
    throw err;
  }

  const query = `
    UPDATE trip_participants
    SET status = ?
    WHERE id_participation = ?
  `;
  const values = [status, participationId];

  const [result] = await db.query(query, values);
  return result.affectedRows;
};

// Obtener información de los participantes aceptados de un viaje
const selectParticipantsInfo = async (tripId, includePrivate = false) => {
  const sqlBase = `
      SELECT 
      u.id_user, 
      u.name,     
      u.photo_url, 
      u.bio, 
      u.interests, 
      u.average_rating
    `;

  const sqlPrivate = `,
      u.email,
      u.phone
    `;

  const sqlFinal = `
      FROM trip_participants tp
      JOIN users u ON u.id_user = tp.id_user
      WHERE tp.id_trip = ?
      AND tp.status = 'accepted'
      ORDER BY tp.created_at DESC
    `;

  const sql = includePrivate ? sqlBase + sqlPrivate + sqlFinal : sqlBase + sqlFinal;

  const [result] = await db.query(sql, [tripId]);
  return result;
};

// Obtener emails de participantes aceptados para notificaciones por email
const selectAcceptedParticipantsEmails = async (tripId) => {
  const query = `
    SELECT u.email, u.name 
    FROM trip_participants tp
    JOIN users u ON tp.id_user = u.id_user
    WHERE tp.id_trip = ? AND tp.status = 'accepted'
  `;
  const [result] = await db.query(query, [tripId]);
  return result;
};

// Borrar una participación por id
const deleteParticipation = async (participationId) => {
  const [result] = await db.query(
    `DELETE FROM trip_participants
     WHERE id_participation = ?`,
    [participationId]
  );

  return result.affectedRows; 
};


// TESTING
const selectParticipations = async () => {
  const [result] = await db.query('select * from trip_participants');
  return result;
};
// TESTING

module.exports = {
  selectParticipationById,
  selectParticipantsByTrip,
  selectMyRequests,
  selectMyCreatorRequests,
  selectByTripAndUser,
  insertParticipation,
  updateParticipationStatus,
  selectParticipations,
  selectParticipantsInfo,
  selectAcceptedParticipantsEmails,
  deleteParticipation,
};
