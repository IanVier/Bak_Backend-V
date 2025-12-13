const router = require('express').Router();

const participants = require('../../controllers/participants.controller');
const { checkToken } = require('../../middlewares/auth.middleware');
const { checkTripExists } = require('../../middlewares/tripValidation.middleware');

router.get('/', participants.getAllParticipations);
// TESTING
router.get('/trip/:tripId', checkTripExists, checkToken, participants.getParticipantsByTrip);
router.get('/:participationId/action', participants.handleParticipationAction);
router.get('/trip-info/:tripId', participants.getParticipantsInfo);
router.get('/my-requests', checkToken, participants.getMyRequests);
router.get('/my-creator-requests', checkToken, participants.getMyCreatorRequests);
router.get('/:participationId', checkToken, participants.getParticipation);
router.post('/:tripId', checkTripExists, checkToken, participants.createParticipation);
router.patch('/:participationId', checkToken, participants.updateParticipationStatus);
router.delete('/:participationId', checkToken, participants.deleteParticipation);

module.exports = router;
