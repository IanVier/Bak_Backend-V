const formatDate = (dateString) => {
  if (!dateString) return 'Por definir';
  return new Date(dateString).toLocaleDateString('es-ES', { 
    day: '2-digit', month: '2-digit', year: 'numeric' 
  });
};

const hasDateChanged = (oldTrip, newTrip) => {
  const oldStart = new Date(oldTrip.start_date).toISOString();
  const newStart = new Date(newTrip.start_date).toISOString();
  const oldEnd = new Date(oldTrip.end_date).toISOString();
  const newEnd = new Date(newTrip.end_date).toISOString();

  return oldStart !== newStart || oldEnd !== newEnd;
};

module.exports = { formatDate, hasDateChanged };