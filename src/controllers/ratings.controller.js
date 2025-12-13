const RatingsModel = require('../models/ratings.model');
/**
 * Se obtiene las valoraciones recibidas en un viaje por ID. 
 * @returns {*} Devuelve un array de JSON con las valoraciones del viaje
 */
const getRatingsByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const ratings = await RatingsModel.selectByTrip(tripId);
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener las valoraciones del viaje' ,
      message: error.message  
    });
  }
};

/**
 * Se obtiene todas las valoraciones de un usuario (ID).
 * @returns {*} Devuelve un array de JSON con las valoraciones al usuario. 
 */
const getRatingsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const ratings = await RatingsModel.selectForUser(userId);
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al obtener las valoraciones del usuario',
      message: error.message 
    });
  }
};


/**
 * Se crea una valoracion asociada a un viaje, realizada por usuario a otro. 
 * @returns Devuelve la valoración realizada. 
 */
const createRating = async (req, res) => {
  try {
    const { id_trip, id_reviewed, score, comment } = req.body;

    const id_reviewer = req.user.id_user;

    if (!id_reviewer) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (id_reviewer === id_reviewed) {
      return res.status(400).json({ message: 'No puedes valorarte a ti mismo' });
    }

    if (id_trip === undefined || id_reviewed === undefined || score === undefined) {
      return res.status(400).json({ message: 'Faltan campos obligatorios: id_trip, id_reviewed, score' });
    }
    if (Number.isNaN(Number(score)) || score < 0 || score > 10) {
      return res.status(400).json({ message: 'El campo score debe estar entre 0 y 10' });
    }

    // Comprobar que ambos están en el mismo viaje
    const bothInTrip = await RatingsModel.checkUsersBelongToTrip(id_trip, id_reviewer, id_reviewed);

    if (!bothInTrip) {
      return res.status(403).json({
        message: 'Solo puedes valorar a usuarios que han participado en el mismo viaje que tú',
      });
    }

    const insertId = await RatingsModel.insertRating({ id_trip, id_reviewer, id_reviewed, score, comment });
    const newRating = await RatingsModel.selectById(insertId);
    res.status(201).json(newRating);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe una valoración para este viaje y usuario' });
    }
    res.status(500).json({ error: 'Error al crear la valoración' });
  }
};

/**
 * Actualiza una valoración ya presente en la BBDD (comprobación inline)
 * @returns Devuelve la valoración actualizada
 */
const updateRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { score, comment } = req.body;
    const id_reviewer = req.user.id_user;
    const rating = await RatingsModel.selectById(ratingId);

    if (!rating) return res.status(404).json({ message: 'Valoración no encontrada' });

    if (rating.id_reviewer !== id_reviewer) {
      return res.status(403).json({ message: 'Solo puedes modificar tus valoraciones' });
    }

    if (score !== undefined && (Number.isNaN(Number(score)) || score < 0 || score > 10)) {
      return res.status(400).json({ message: 'El campo score debe estar entre 0 y 10' });
    }

    const affectedRows = await RatingsModel.updateRating(ratingId, { score, comment });

    if (affectedRows === 0) return res.status(400).json({ message: 'No hay campos válidos para actualizar' });

    const updated = await RatingsModel.selectById(ratingId);
    
    res.json(updated);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe una valoración para este viaje y usuario' });
    }
    console.error('Error actualizando valoración:', error);
    res.status(500).json({ error: 'Error al actualizar la valoración' });
  }
};

/**
 * Elimina la valoracion ya presente en la BBDD (comprobacion inline)
 * @returns Devuelve un mensaje de confirmación de borrado.
 */
const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const id_reviewer = req.user.id_user;

    const rating = await RatingsModel.selectById(ratingId);

    if (!rating) return res.status(404).json({ message: 'Valoración no encontrada' });

    if (rating.id_reviewer !== id_reviewer) {
      return res.status(403).json({ message: 'Solo puedes modificar tus valoraciones' });
    }

    const success = await RatingsModel.deleteRating(ratingId);
    if (!success) return res.status(500).json({ error: 'No se pudo borrar la valoración' });
   
    res.json({ message: 'Valoración eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando valoración:', error);
    res.status(500).json({ error: 'Error al eliminar la valoración' });
  }
};


module.exports = { getRatingsByTrip, getRatingsByUserId, createRating, updateRating, deleteRating };
