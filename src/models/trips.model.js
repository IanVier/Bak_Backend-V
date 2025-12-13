const db = require('../config/db');

const buildTripsFilterQuery = (filters = {}) => {
  let sql = `select t.*, u.name as creator_name, 
    (select count(*) from trip_participants tp where tp.id_trip = t.id_trip and tp.status = 'accepted') 
    as accepted_participants
    from trips t
    inner join users u ON t.id_creator = u.id_user
    where 1=1
  `;
  const params = [];
  const { status, departure, destination, start_date, end_date, creator, participant, participantStatus, creatorId, excludeCreatorForParticipant, sortBy, sortOrder, cost } = filters;
  if (status) {
    sql += ' and t.status = ?';
    params.push(status);
  }
  if (departure) {
    sql += ' and t.departure LIKE ?';
    params.push(`%${departure}%`);
  }
  if (destination) {
    const term = `%${destination}%`;
    sql += ` and (t.destination LIKE ? COLLATE utf8mb4_unicode_ci OR t.title LIKE ? COLLATE utf8mb4_unicode_ci)`;
    params.push(term, term);
  }
  if (start_date) {
    sql += ' and t.start_date = ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' and t.end_date = ?';
    params.push(end_date);
  }
  if (creator) {
    sql += ' and u.name LIKE ?';
    params.push(`%${creator}%`);
  }
  if (participant) {
    if (participantStatus) {
      sql += `
        and exists (select 1 from trip_participants tp where tp.id_trip = t.id_trip and tp.id_user = ? and tp.status = ?)`;
      params.push(participant, participantStatus);
    } else {
      sql += `
        and exists (select 1 from trip_participants tp where tp.id_trip = t.id_trip and tp.id_user = ?)`;
      params.push(participant);
    }
    if (excludeCreatorForParticipant) {
      sql += ' and t.id_creator <> ?';
      params.push(participant);
    }
  }
  if (creatorId) {
    sql += ' and t.id_creator = ?';
    params.push(creatorId);
  }

  if (cost) {
    sql += ' and t.cost_per_person <= ?';
    params.push(cost);
  }

  const allowedSortFields = {
    start_date: 't.start_date',
    end_date: 't.end_date',
    min_participants: 't.min_participants',
    max_participants: 'accepted_participants',
    cost_per_person: 't.cost_per_person',
    departure: 't.departure',
    created_at: 't.created_at',
  };

  const sortColumn = allowedSortFields[sortBy] || 't.start_date';
  const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

  sql += ` order by ${sortColumn} ${order}`;

  return { sql, params };
};

const selectTrips = async (filters = {}) => {
  const { sql, params } = buildTripsFilterQuery(filters);
  const [result] = await db.query(sql, params);
  return result;
};

const selectTripsPaginated = async (filters = {}, page = 1, pageSize = 10) => {
  const { sql, params } = buildTripsFilterQuery(filters);

  const countSql = `select count(*) as total from (${sql}) as sub`;
  const [countRows] = await db.query(countSql, params);
  const total = countRows[0]?.total || 0;

  const offset = (page - 1) * pageSize;
  const paginatedSql = `${sql} limit ? offset ?`;
  const [rows] = await db.query(paginatedSql, [...params, pageSize, offset]);

  return { trips: rows, total };
};

const tripsById = async (tripId) => {
  const [result] = await db.query(
    `select t.*, u.name as creator_name, 
    (select count(*) from trip_participants tp where tp.id_trip = t.id_trip and tp.status = 'accepted') 
    as accepted_participants
    from trips t
    inner join users u ON t.id_creator = u.id_user
    where id_trip = ?`,
    [tripId]
  );
  if (result.length === 0) return null;
  return result[0];
};

const insertTrip = async ({
  id_creator,
  title,
  description,
  destination,
  start_date,
  end_date,
  cost_per_person,
  min_participants,
  max_participants,
  transport_info,
  accommodation_info,
  itinerary,
  image_url,
  status,
  departure,
}) => {
  const [result] = await db.query(
    `insert into trips 
    (id_creator, title, description, destination, start_date, end_date, cost_per_person, min_participants,max_participants, transport_info, accommodation_info, itinerary,image_url, status,departure) 
    values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id_creator,
      title,
      description,
      destination,
      start_date,
      end_date,
      cost_per_person,
      min_participants,
      max_participants,
      transport_info,
      accommodation_info,
      itinerary,
      image_url,
      status,
      departure,
    ]
  );

  return result;
};

const updateTrip = async (
  tripId,
  { title, description, destination, start_date, end_date, cost_per_person, min_participants, max_participants, transport_info, accommodation_info, itinerary, image_url, status, departure }
) => {
  const [result] = await db.query(
    `update trips set       
       title = ?,
       description = ?,
       destination = ?,
       start_date = ?,
       end_date = ?,
       cost_per_person = ?,
       min_participants = ?,
       max_participants = ?,
       transport_info = ?,
       accommodation_info = ?,
       itinerary = ?,
       image_url = ?,
       status = ?,
       departure = ?
     where id_trip = ?`,
    [title, description, destination, start_date, end_date, cost_per_person, min_participants, max_participants, transport_info, accommodation_info, itinerary, image_url, status, departure, tripId]
  );

  return result;
};

const deleteTrip = async (tripId) => {
  const [result] = await db.query('delete from trips where id_trip = ?', [tripId]);
  return result;
};

const refreshTripsStatus = async () => {
  await db.query(
    `UPDATE trips
     SET status = 'completed'
     WHERE end_date < CURDATE()
       AND status <> 'completed'`
  );

  await db.query(
    `UPDATE trips t
     SET t.status = 'closed'
     WHERE t.status = 'open'
       AND t.end_date >= CURDATE()
       AND t.max_participants IS NOT NULL
       AND t.max_participants > 0
       AND (
         SELECT COUNT(*)
         FROM trip_participants tp
         WHERE tp.id_trip = t.id_trip
           AND tp.status = 'accepted'
       ) >= t.max_participants`
  );

  await db.query(
    `UPDATE trips
     SET status = 'closed'
     WHERE status = 'open'
       AND start_date <= CURDATE()
       AND end_date >= CURDATE()`
  );
};

module.exports = { selectTrips, selectTripsPaginated, tripsById, insertTrip, updateTrip, deleteTrip, refreshTripsStatus };
