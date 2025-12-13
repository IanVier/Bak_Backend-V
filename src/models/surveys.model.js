const db = require('../config/db');

const selectSurveysByTrip = async (tripId, userId) => {
  const [surveys] = await db.query(
    `
    SELECT
      s.id_survey,
      s.id_trip,
      s.id_creator,
      u.name AS creator_name,
      s.question,
      s.is_closed,
      DATE_FORMAT(CONVERT_TZ(s.created_at, @@session.time_zone, '+00:00'), '%Y-%m-%d %H:%i:%s') AS created_at,
      (
        SELECT v.id_option
        FROM trip_survey_votes v
        WHERE v.id_survey = s.id_survey AND v.id_user = ?
      ) AS user_voted_option
    FROM trip_surveys s
    JOIN users u ON u.id_user = s.id_creator
    WHERE s.id_trip = ?
    ORDER BY s.created_at ASC
    `,
    [userId, tripId]
  );

  if (!surveys.length) return [];

  const surveyIds = surveys.map((s) => s.id_survey);

  const [options] = await db.query(
    `
    SELECT
      o.id_option,
      o.id_survey,
      o.option_text,
      COUNT(v.id_user) AS vote_count
    FROM trip_survey_options o
    LEFT JOIN trip_survey_votes v ON v.id_option = o.id_option
    WHERE o.id_survey IN (${surveyIds.map(() => '?').join(',')})
    GROUP BY o.id_option
    ORDER BY o.id_option ASC
    `,
    surveyIds
  );

  const optionsBySurvey = new Map();
  for (const opt of options) {
    if (!optionsBySurvey.has(opt.id_survey)) optionsBySurvey.set(opt.id_survey, []);
    optionsBySurvey.get(opt.id_survey).push({
      id_option: opt.id_option,
      option_text: opt.option_text,
      vote_count: Number(opt.vote_count),
    });
  }

  return surveys.map((s) => ({
    ...s,
    is_closed: Boolean(s.is_closed),
    user_voted_option: s.user_voted_option ? Number(s.user_voted_option) : null,
    options: optionsBySurvey.get(s.id_survey) || [],
  }));
};

const insertSurveyWithOptions = async ({ id_trip, id_creator, question, options }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [r1] = await conn.query(`INSERT INTO trip_surveys (id_trip, id_creator, question) VALUES (?, ?, ?)`, [id_trip, id_creator, question]);

    const id_survey = r1.insertId;

    for (const optText of options) {
      await conn.query(`INSERT INTO trip_survey_options (id_survey, option_text) VALUES (?, ?)`, [id_survey, optText]);
    }

    await conn.commit();
    return id_survey;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const selectSurveyById = async (surveyId) => {
  const [rows] = await db.query(`SELECT * FROM trip_surveys WHERE id_survey = ?`, [surveyId]);
  return rows.length ? rows[0] : null;
};

const selectOptionById = async (optionId) => {
  const [rows] = await db.query(`SELECT * FROM trip_survey_options WHERE id_option = ?`, [optionId]);
  return rows.length ? rows[0] : null;
};

const upsertVote = async ({ surveyId, userId, optionId }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [sRows] = await conn.query(`SELECT * FROM trip_surveys WHERE id_survey = ? FOR UPDATE`, [surveyId]);

    if (!sRows.length) {
      const err = new Error('SURVEY_NOT_FOUND');
      err.code = 'SURVEY_NOT_FOUND';
      throw err;
    }

    if (sRows[0].is_closed) {
      const err = new Error('SURVEY_CLOSED');
      err.code = 'SURVEY_CLOSED';
      throw err;
    }

    await conn.query(
      `
      INSERT INTO trip_survey_votes (id_survey, id_user, id_option)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE id_option = VALUES(id_option), created_at = CURRENT_TIMESTAMP
      `,
      [surveyId, userId, optionId]
    );

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const closeSurvey = async (surveyId) => {
  const [r] = await db.query(`UPDATE trip_surveys SET is_closed = 1 WHERE id_survey = ? AND is_closed = 0`, [surveyId]);
  return r.affectedRows;
};

module.exports = {
  selectSurveysByTrip,
  insertSurveyWithOptions,
  selectSurveyById,
  selectOptionById,
  upsertVote,
  closeSurvey,
};
