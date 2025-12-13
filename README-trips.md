## VIAJES

### Recuperar todos los viajes

Method: GET
Url: /api/trips
Headers: X
Body: X

Parámetros opcionales:

- status
- departure
- destination
- date
- creator
- participant
- participantStatus
- cost

Paginación:

- page (por defecto 1)
- pageSize (por defecto 10)

Ordenación:

- sortBy: start_date, end_date, created_at, cost_per_person, min_participants, max_participants, departure
- sortOrder: asc | desc

Ejemplo:
GET /api/trips?status=open&destination=Madrid&page=1&pageSize=10&sortBy=created_at&sortOrder=desc

Ejemplo de respuesta:

{
"id_trip": 46,
"id_creator": 18,
"title": "Relax en Riviera Maya",
"description": "Playas paradisíacas, cenotes y visita a Chichén Itzá.",
"destination": "México",
"departure": "Madrid",
"start_date": "2026-08-02T22:00:00.000Z",
"end_date": "2026-08-11T22:00:00.000Z",
"cost_per_person": 1500,
"min_participants": 6,
"max_participants": 6,
"transport_info": "Vuelo a Cancún + transporte privado",
"accommodation_info": "Resort todo incluido",
"itinerary": "Día 2: Cenote Azul, Día 4: Tulum, Día 7: Chichén Itzá",
"status": "open",
"created_at": "2025-11-21T17:01:38.000Z",
"updated_at": "2025-11-21T17:01:38.000Z",
"creator_name": "Alberto García",
"accepted_participants": 2
}

Response:

- Array con todos los viajes filtrados, paginados y ordenados

# Filtros

# Recuperar viajes por estado

Method: GET
Url: /api/trips?status=estado
Headers: X
Body: X

Ejemplo:
GET /api/trips?status=open

# Recuperar viajes por origen de salida

Method: GET
Url: /api/trips?departure=ciudad
Headers: X
Body: X

Ejemplo:
GET /api/trips?departure=Madrid

# Recuperar viajes por destino

Method: GET
Url: /api/trips?destination=ciudad
Headers: X
Body: X

Ejemplo:
GET /api/trips?destination=Nueva%20Zelanda

# Recuperar viajes por fecha

Method: GET
Url: /api/trips?date=yyyy-mm-dd
Headers: X
Body: X

Ejemplo:
GET /api/trips?date=2026-01-15

# Recuperar viajes por organizador

Method: GET
Url: /api/trips?creator={nombre_creador}
Headers: X
Body: X

Ejemplo:
GET /api/trips?creator=Alberto

### Recuperar datos de un viaje

Method: GET
Url: /api/trips/:id
Headers: X
Body: X

Response:

- Datos completos de un viaje

Ejemplo:
GET /api/trips/1

### Recuperar viajes creados por mi usuario

Method: GET
Url: /api/trips/me/created
Headers: Authorization: {{TOKEN}}
Body: X

Response:

- Viajes creados por el usuario

### Recuperar viajes activos de un usuario

Method: GET
Url: /api/trips/me/participant
Headers: Authorization: {{TOKEN}}
Body: X

Response:

- Viajes donde ha solicitado participar

### Recuperar viajes por precio máximo por participante

Method: GET
Url: /api/trips?cost={value}
Headers: X
Body: X

Descripción:

- Devuelve todos los viajes cuyo cost_per_person es menor o igual que el valor indicado.

Ejemplo:
GET /api/trips?cost=1000

# Filtros

### Solo PENDING

GET /api/trips/me/participant?participantStatus=pending

### Solo ACCEPTED

GET /api/trips/me/participant?participantStatus=accepted

### Solo REJECTED

GET /api/trips/me/participant?participantStatus=rejected

### Solo LEFT

GET /api/trips/me/participant?participantStatus=left

### Creación de un viaje

Method: POST
Url: /api/trips
Headers: Authorization: {{TOKEN}}
Body: Campos del viaje

Ejemplo:
{
"title": "Trekking en Nueva Zelanda",
"description": "Recorrido por los Alpes Neozelandeses...",
"destination": "Nueva Zelanda",
"start_date": "2026-10-01",
"end_date": "2026-10-18",
"cost_per_person": 2400,
"min_participants": 4,
"max_participants": 6,
"transport_info": "Vuelo a Auckland y campervan",
"accommodation_info": "Campings y lodges",
"itinerary": "Día 1: Auckland...",
"image_url": "https://example.com/foto.jpg",
"status": "open",
"departure": "Madrid"
}

### Actualizar datos de un viaje

Method: PUT
Url: /api/trips/:id
Headers: Authorization: {{TOKEN}}
Body: Campos a modificar

Ejemplo:
{
"title": "Aventura en China",
"description": "Exploración de glaciares...",
"destination": "China",
"start_date": "2026-01-15",
"end_date": "2026-01-22",
"cost_per_person": 1200,
"min_participants": 4,
"max_participants": 6,
"transport_info": "Vuelo directo",
"accommodation_info": "Cabañas rurales",
"itinerary": "Día 1: llegada...",
"image_url": "https://example.com/foto.jpg",
"status": "open",
"departure": "Madrid"
}

### Borrar datos de viaje

Method: DELETE
Url: /api/trips/:id
Headers: Authorization: {{TOKEN}}
Body: X

Ejemplo:
DELETE /api/trips/26
