const SurveysModel = require('../models/surveys.model');
const ParticipantsModel = require('../models/participants.model');

const getSurveysByTrip = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { tripId } = req.params;

    const surveys = await SurveysModel.selectSurveysByTrip(tripId, userId);
    return res.json(surveys);
  } catch (e) {
    console.error('getSurveysByTrip error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const createSurvey = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { tripId } = req.params;
    const { question, options } = req.body;

    if (!question || question.trim() === '' || question.length > 200) {
      return res.status(400).json({ error: 'Pregunta inválida (1-200 caracteres)' });
    }

    if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
      return res.status(400).json({ error: 'Debe proporcionar entre 2 y 10 opciones' });
    }

    const cleanOptions = options.map((o) => String(o).trim()).filter(Boolean);

    if (cleanOptions.length < 2 || cleanOptions.length > 10) {
      return res.status(400).json({ error: 'Debe proporcionar entre 2 y 10 opciones' });
    }
    if (cleanOptions.some((o) => o.length > 100)) {
      return res.status(400).json({ error: 'Cada opción debe tener entre 1 y 100 caracteres' });
    }

    const idSurvey = await SurveysModel.insertSurveyWithOptions({
      id_trip: tripId,
      id_creator: userId,
      question: question.trim(),
      options: cleanOptions,
    });

    const surveys = await SurveysModel.selectSurveysByTrip(tripId, userId);
    const created = surveys.find((s) => Number(s.id_survey) === Number(idSurvey));

    return res.status(201).json(created);
  } catch (e) {
    console.error('createSurvey error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const voteSurvey = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { surveyId } = req.params;
    const { id_option } = req.body;

    if (!id_option) return res.status(400).json({ error: 'id_option es requerido' });

    const survey = await SurveysModel.selectSurveyById(surveyId);
    if (!survey) return res.status(404).json({ error: 'Encuesta no encontrada' });

    // Validar que el usuario es participante aceptado del viaje de esa encuesta
    const participation = await ParticipantsModel.selectByTripAndUser(survey.id_trip, userId);
    if (!participation || participation.status !== 'accepted') {
      return res.status(403).json({ error: 'Debes ser participante aceptado del viaje' });
    }

    // validar que la opción pertenece a esa encuesta
    const opt = await SurveysModel.selectOptionById(id_option);
    if (!opt || Number(opt.id_survey) !== Number(surveyId)) {
      return res.status(404).json({ error: 'Opción no encontrada' });
    }

    await SurveysModel.upsertVote({ surveyId, userId, optionId: id_option });

    const tripSurveys = await SurveysModel.selectSurveysByTrip(survey.id_trip, userId);
    const updated = tripSurveys.find((s) => Number(s.id_survey) === Number(surveyId));

    return res.json(updated);
  } catch (e) {
    if (e.code === 'SURVEY_CLOSED') return res.status(400).json({ error: 'La encuesta está cerrada' });
    if (e.code === 'SURVEY_NOT_FOUND') return res.status(404).json({ error: 'Encuesta no encontrada' });

    console.error('voteSurvey error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const closeSurvey = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { surveyId } = req.params;

    const survey = await SurveysModel.selectSurveyById(surveyId);
    if (!survey) return res.status(404).json({ error: 'Encuesta no encontrada' });

    // Validar participante aceptado
    const participation = await ParticipantsModel.selectByTripAndUser(survey.id_trip, userId);
    if (!participation || participation.status !== 'accepted') {
      return res.status(403).json({ error: 'Debes ser participante aceptado del viaje' });
    }

    if (Number(survey.id_creator) !== Number(userId)) {
      return res.status(403).json({ error: 'Solo el creador puede cerrar la encuesta' });
    }
    if (survey.is_closed) {
      return res.status(400).json({ error: 'La encuesta ya está cerrada' });
    }

    await SurveysModel.closeSurvey(surveyId);
    return res.json({ message: 'Encuesta cerrada correctamente' });
  } catch (e) {
    console.error('closeSurvey error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getSurveysByTrip, createSurvey, voteSurvey, closeSurvey };
