const TripsModel = require('../models/trips.model');

const checkTripExists = async (req, res, next) => {
  const tripId = req.params.idTrip || req.params.tripId || req.params.trip_id || req.body.id_trip;

  if (!tripId) {
    return res.status(400).json({ message: 'Falta el id del viaje' });
  }

  const trip = await TripsModel.tripsById(tripId);

  if (!trip) {
    return res.status(404).json({ message: 'El viaje no existe' });
  }

  req.trip = trip;
  next();
};

module.exports = { checkTripExists };
