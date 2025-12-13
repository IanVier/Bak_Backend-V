const db = require('../config/db');

/**
 * Obtiene todas las valoraciones de un viaje ordenadas por fecha descendente.
 * @param {number} tripId - Identificador del viaje (`ratings.id_trip`) en BBDD.
 * @returns {Promise<Array>} Lista de valoraciones del viaje.
 */
const selectByTrip = async (tripId) => {
  const [result] = await db.query(`SELECT * FROM ratings WHERE id_trip = ? ORDER BY created_at DESC`, [tripId]);
  return result;
};

/**
 * Obtiene todas las valoraciones recibidas por un usuario ordenadas por fecha descendente.
 * @param {number} userId - Identificador del usuario valorado (`ratings.id_reviewed`).
 * @returns {Promise<Array>} Lista de valoraciones recibidas.
 */
const selectForUser = async (userId) => {
  const [rows] = await db.query(`SELECT * FROM ratings WHERE id_reviewed = ? ORDER BY created_at DESC`, [userId]);
  return rows;
};

/**
 * Recupera una valoración concreta por su id.
 * @param {number} ratingId - Identificador de la valoración (`ratings.id_rating`).
 * @returns {Promise<Object|null>} Valoración encontrada o null si no existe.
 */
const selectById = async (ratingId) => {
  const [result] = await db.query(`SELECT * FROM ratings WHERE id_rating = ?`, [ratingId]);
  return result[0] || null;
};

/**
 * Inserta una nueva valoración.
 * @param {Object} ratingData - Datos de la valoración.
 * @param {number} ratingData.id_trip - Viaje valorado.
 * @param {number} ratingData.id_reviewer - Usuario que valora.
 * @param {number} ratingData.id_reviewed - Usuario valorado.
 * @param {number} ratingData.score - Puntuación (0-10).
 * @param {string} [ratingData.comment] - Comentario opcional.
 * @returns {Promise<number>} ID autogenerado de la nueva valoración.
 */
const insertRating = async ({ id_trip, id_reviewer, id_reviewed, score, comment }) => {
  const [result] = await db.query(
    `INSERT INTO ratings (id_trip, id_reviewer, id_reviewed, score, comment)
     VALUES (?, ?, ?, ?, ?)`,
    [id_trip, id_reviewer, id_reviewed, score, comment || null]
  );
  return result.insertId;
};

/**
 * Actualiza campos permitidos de una valoración.
 * @param {number} ratingId - ID de la valoración a actualizar.
 * @param {Object} fields - Campos a modificar (score y/o comment).
 * @returns {Promise<number>} Número de filas afectadas (0 si no se actualiza nada).
 */
const updateRating = async (ratingId, fields) => {
  const set = [];
  const values = [];
  ['score', 'comment'].forEach((key) => {
    if (fields[key] !== undefined) {
      set.push(`${key} = ?`);
      values.push(fields[key]);
    }
  });
  if (set.length === 0) return null;
  values.push(ratingId);
  const [result] = await db.query(`UPDATE ratings SET ${set.join(', ')} WHERE id_rating = ?`, values);
  return result.affectedRows;
};

/**
 * Elimina una valoración por su ID.
 * @param {number} ratingId - Identificador de la valoración a borrar.
 * @returns {Promise<number>} Número de filas afectadas (0 si no existía).
 */
const deleteRating = async (ratingId) => {
  const [result] = await db.query(`DELETE FROM ratings WHERE id_rating = ?`, [ratingId]);
  return result.affectedRows === 1;
};


/**
 * Comprueba si dos usuarios (reviewer y reviewed) pertenecen al mismo viaje.
 * Pueden ser el creador del viaje o participantes aceptados.
 */
const checkUsersBelongToTrip = async (id_trip, id_reviewer, id_reviewed) => {
  const [rows] = await db.query(
    `
    SELECT
      SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) AS reviewer_in_trip,
      SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) AS reviewed_in_trip
    FROM (
      -- CREADOR DEL VIAJE
      SELECT t.id_creator AS user_id
      FROM trips t
      WHERE t.id_trip = ?

      UNION ALL

      -- PARTICIPANTES ACEPTADOS DEL VIAJE
      SELECT tp.id_user AS user_id
      FROM trip_participants tp
      WHERE tp.id_trip = ?
        AND tp.status = 'accepted'
    ) AS users_in_trip
    `,
    [id_reviewer, id_reviewed, id_trip, id_trip]
  );

  if (!rows || !rows[0]) return false;

  return rows[0].reviewer_in_trip > 0 && rows[0].reviewed_in_trip > 0;
};

module.exports = {
  selectByTrip,
  selectForUser,
  selectById,
  insertRating,
  updateRating,
  deleteRating,
  checkUsersBelongToTrip,
};
