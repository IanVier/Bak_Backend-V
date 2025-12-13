// Define your model here
const db = require('../config/db');

/**
 * Mensaje por id con el formato que espera el frontend
 */
const selectMessageById = async (messageId) => {
  const [rows] = await db.query(
    `
    SELECT
      m.id_message,
      m.id_trip,
      m.id_author AS id_user,
      u.name AS user_name,
      m.content AS message,
      DATE_FORMAT(CONVERT_TZ(m.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%d %H:%i:%s') AS created_at,
      m.id_parent_message,
      pm.content AS parent_message
    FROM trip_messages m
    JOIN users u ON u.id_user = m.id_author
    LEFT JOIN trip_messages pm ON pm.id_message = m.id_parent_message
    WHERE m.id_message = ?
    `,
    [messageId]
  );

  return rows.length ? rows[0] : null;
};

/**
 * Todos los mensajes de un viaje (flat), ordenados ASC
 */
const selectMessagesByTrip = async (tripId) => {
  const [rows] = await db.query(
    `
    SELECT
      m.id_message,
      m.id_trip,
      m.id_author AS id_user,
      u.name AS user_name,
      m.content AS message,
      DATE_FORMAT(CONVERT_TZ(m.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%d %H:%i:%s') AS created_at,
      m.id_parent_message,
      pm.content AS parent_message
    FROM trip_messages m
    JOIN users u ON u.id_user = m.id_author
    LEFT JOIN trip_messages pm ON pm.id_message = m.id_parent_message
    WHERE m.id_trip = ?
    ORDER BY m.created_at ASC
    `,
    [tripId]
  );

  return rows;
};

/*
 * Crear un mensaje
 */
const insertMessage = async ({ id_trip, id_author, id_parent_message = null, content }) => {
  const [result] = await db.query(
    `
      INSERT INTO trip_messages (id_trip, id_author, id_parent_message, content)
      VALUES (?, ?, ?, ?)
    `,
    [id_trip, id_author, id_parent_message || null, content]
  );

  return result.insertId;
};

/*
 * Update mensaje
 */
const updateMessageContent = async (messageId, content) => {
  const [result] = await db.query(
    `
      UPDATE trip_messages
      SET content = ?
      WHERE id_message = ?
    `,
    [content, messageId]
  );

  return result.affectedRows; // 0 o 1
};

/**
 * Comprobar si mensaje tiene hijos
 * (para montar arbol de mensajes)
 */
const hasChildren = async (messageId) => {
  const [rows] = await db.query(
    `
      SELECT COUNT(*) AS children_count
      FROM trip_messages
      WHERE id_parent_message = ?
    `,
    [messageId]
  );

  return rows[0].children_count > 0;
};

/**
 * Borrado físico  de un mensaje
 * (para los mensajes q no tienen hijos)
 */
const deleteMessageHard = async (messageId) => {
  const [result] = await db.query(
    `
      DELETE FROM trip_messages
      WHERE id_message = ?
    `,
    [messageId]
  );

  return result.affectedRows; // 0 o 1
};

/**
 * Borrado lógico
 *    (para los mensajes que tienen hijos)
 *  Update y  Se pone 'deleted mensaje'
 */
const softDeleteMessage = async (messageId) => {
  const [result] = await db.query(
    `
      UPDATE trip_messages
      SET content = '[Deleted Message]'
      WHERE id_message = ?
    `,
    [messageId]
  );

  return result.affectedRows; // 0 o 1
};

module.exports = {
  selectMessageById,
  selectMessagesByTrip,
  insertMessage,
  updateMessageContent,
  hasChildren,
  deleteMessageHard,
  softDeleteMessage,
};
