const ParticipantsModel = require('../models/participants.model');

const checkAcceptedParticipant = async (req, res, next) => {
  try {
    const userId = req.user.id_user;
    const tripId = req.params.tripId || req.params.idTrip || req.params.trip_id || req.body.id_trip;

    if (!tripId) {
      return res.status(400).json({ error: 'Falta tripId' });
    }

    const participation = await ParticipantsModel.selectByTripAndUser(tripId, userId);

    if (!participation || participation.status !== 'accepted') {
      return res.status(403).json({ error: 'Debes ser participante aceptado del viaje' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { checkAcceptedParticipant };
