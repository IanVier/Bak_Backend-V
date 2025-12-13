const router = require('express').Router();
const surveys = require('../../controllers/surveys.controller');

router.post('/:surveyId/vote', surveys.voteSurvey);
router.patch('/:surveyId/close', surveys.closeSurvey);

module.exports = router;
