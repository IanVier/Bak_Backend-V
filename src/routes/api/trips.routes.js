const trips = require('../../controllers/trips.controller');
const messages = require('../../controllers/messages.controller');
const surveys = require('../../controllers/surveys.controller');
const { checkAcceptedParticipant } = require('../../middlewares/tripParticipant.middleware');
const { checkToken } = require('../../middlewares/auth.middleware');
const { checkTripExists } = require('../../middlewares/tripValidation.middleware');

const router = require('express').Router();

//trips
router.get('/', trips.getAllTrips);
router.get('/me/created', checkToken, trips.getMyTrips);
router.get('/me/participant', checkToken, trips.getMyTripsAsParticipant);
router.get('/:tripId', checkTripExists, trips.getTripById);
router.post('/', checkToken, trips.createTrip);
router.put('/:tripId', checkToken, checkTripExists, trips.updateTrip);
router.delete('/:tripId', checkToken, checkTripExists, trips.deleteTrip);

//messages
router.get('/:tripId/messages', checkToken, checkTripExists, checkAcceptedParticipant, messages.getMessagesByTrip);
router.post('/:tripId/messages', checkToken, checkTripExists, checkAcceptedParticipant, messages.createMessage);

//surveys
router.get('/:tripId/surveys', checkToken, checkTripExists, checkAcceptedParticipant, surveys.getSurveysByTrip);
router.post('/:tripId/surveys', checkToken, checkTripExists, checkAcceptedParticipant, surveys.createSurvey);

module.exports = router;
