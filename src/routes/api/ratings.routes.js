const router = require('express').Router();
const ratings = require('../../controllers/ratings.controller');
const { checkTripExists } = require('../../middlewares/tripValidation.middleware');

// Valoraciones de un viaje concreto
router.get('/trip/:tripId', checkTripExists, ratings.getRatingsByTrip);

// Valoraciones recibidas por un usuario
router.get('/user/:userId', ratings.getRatingsByUserId);

// Crear una valoración tras finalizar un viaje
router.post('/', checkTripExists, ratings.createRating);

// Editar la valoración realizada por el usuario autenticado
router.patch('/:ratingId', ratings.updateRating);

// Eliminar una valoración creada por el usuario autenticado
router.delete('/:ratingId', ratings.deleteRating);

module.exports = router;
