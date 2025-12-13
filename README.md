# app-viajes-backend

## USUARIOS

### Registro usuarios

Method: PUT
url: /api/users/login
Headres : X
Body: { email, password}

Response:

- Mensaje de confirmacion y Token

Ejemplo: PUT URL/api/users/register

{
"name": "Manuel Rojo",
"email":"manulito@example.com",
"password":"manuelito",
"phone":"+34674267589",
"photo_url":"https://example.com/photos/aoki.jpg",
"bio":"Me gusta viajar en patinete",
"interests":"Costa, islas",
"average_rating":0.0,
"rating_count":0
}

### Login usuarios

Method: POST
url: /api/users/login
Headres : X
Body: { email, password}

Response:

- Mensaje de confirmacion y Token

Ejemplo: POST URL/api/users/login

{
"email":"albertogarcia@example.com",
"password":"albertogarcia"
}

## Valoraciones

### Crear una valoración

Method: POST
Url: /api/valoraciones
Headers: Token
Body: { id_trip, id_reviewed, score (0-10), comment? }

Response:

- Datos de la nueva valoración y medias del usuario valorado si se recalculan

### Listar valoraciones de un viaje

Method: GET
Url: /api/valoraciones/viaje/:idTrip
Headers: X
Body: X

Response:

- Array con las valoraciones hechas en ese viaje, con autor (id_reviewer), usuario valorado (id_reviewed), puntuación y comentario

### Listar valoraciones recibidas por un usuario

Method: GET
Url: /api/valoraciones/usuario/:idUser
Headers: X
Body: X

Response:

- Array con valoraciones recibidas por el usuario y datos como puntuación media, rating_count

### Actualizar una valoración

Method: PATCH
Url: /api/valoraciones/:idRating
Headers: ?
Body: { score?, comment? }

Response:

- Valoración actualizada

### Borrar una valoración

Method: DELETE
Url: /api/valoraciones/:idRating
Headers: Token
Body: X

Response:

- Confirmación de borrado de la valoración (dando la valoración borrada),

## Participants

### 1. Ver una determinada solicitud

Method: GET  
Url: /api/participants/:participation_id  
Headers: X  
Body: X

Ejemplo de respuesta:

{
"id_participation": 10,
"id_trip": 1,
"id_user": 2,
"status": "accepted",
"message": "Solicitud pendiente del usuario 2 en el viaje 1.",
"created_at": "2025-11-16T21:19:13.000Z",
"updated_at": "2025-11-16T22:35:25.000Z"
}

Response:

- Objeto con los datos de la solicitud

### 2. Ver solicitudes/participantes de un viaje (todos los estados)

Method: GET  
Url: /api/participants/trip/:trip_id  
Headers: X  
Body: X

Ejemplo de respuesta:

[
{
"id_participation": 10,
"id_trip": 1,
"id_user": 2,
"status": "accepted",
"message": "Solicitud pendiente extra del usuario 2 en el viaje 1.",
"created_at": "2025-11-16T21:19:13.000Z",
"updated_at": "2025-11-16T22:35:25.000Z"
},
{
"id_participation": 1,
"id_trip": 1,
"id_user": 1,
"status": "accepted",
"message": "Esto es un mensaje",
"created_at": "2025-11-16T21:13:51.000Z",
"updated_at": "2025-11-16T21:13:51.000Z"
},
{
"id_participation": 2,
"id_trip": 1,
"id_user": 3,
"status": "pending",
"message": "Quiero ir pero no sé a dónde vamos.",
"created_at": "2025-11-16T21:13:51.000Z",
"updated_at": "2025-11-16T21:13:51.000Z"
},
{
"id_participation": 3,
"id_trip": 1,
"id_user": 4,
"status": "rejected",
"message": "Solicitud rechazada por motivos misteriosos.",
"created_at": "2025-11-16T21:13:51.000Z",
"updated_at": "2025-11-16T21:13:51.000Z"
}
]

Response:

- Array con todas las solicitudes de ese viaje, independientemente del estado

### 2.1 Ver solicitudes/participantes de un viaje por estado

Method: GET  
Url: /api/participants/trip/:trip_id?status={estado}  
Headers: X  
Body: X

Valores posibles de status:

- pending
- accepted
- rejected
- left

Ejemplo:

GET /api/participants/trip/1?status=accepted

Ejemplo de respuesta:

[
{
"id_participation": 10,
"id_trip": 1,
"id_user": 2,
"status": "accepted",
"message": "Solicitud pendiente extra del usuario 2 en el viaje 1.",
"created_at": "2025-11-16T21:19:13.000Z",
"updated_at": "2025-11-16T22:35:25.000Z"
},
{
"id_participation": 1,
"id_trip": 1,
"id_user": 1,
"status": "accepted",
"message": "Soy el creador pero también figuro como participante.",
"created_at": "2025-11-16T21:13:51.000Z",
"updated_at": "2025-11-16T21:13:51.000Z"
}
]

Response:

- Array con las solicitudes de ese viaje filtradas por estado

### 3. Ver todas las solicitudes que ha realizado un usuario (como solicitante)

Method: GET  
Url: /api/participants/my-requests  
Headers: X  
Body: X

Ejemplo de respuesta:

[
{
"id_participation": 1,
"id_trip": 1,
"id_user": 1,
"status": "accepted",
"message": "Esto es un mensaje",
"created_at": "2025-11-16T21:13:51.000Z",
"updated_at": "2025-11-16T21:13:51.000Z"
},
{
"id_participation": 6,
"id_trip": 2,
"id_user": 1,
"status": "pending",
"message": "También quiero pasear por Lisboa inventada.",
"created_at": "2025-11-16T21:13:51.000Z",
"updated_at": "2025-11-16T21:13:51.000Z"
}
]

Response:

- Array con todas las solicitudes que el usuario ha enviado a distintos viajes

### 3.1 Ver solicitudes del usuario filtradas por estado

Method: GET  
Url: /api/participants/my-requests?status={estado}  
Headers: X  
Body: X

Ejemplo:

GET /api/participants/my-requests?status=pending

Ejemplo de respuesta:

[
{
"id_participation": 10,
"id_trip": 1,
"id_user": 2,
"status": "pending",
"message": "Solicitud pendiente extra del usuario 2 en el viaje 1.",
"created_at": "2025-11-16T21:19:13.000Z",
"updated_at": "2025-11-16T22:35:25.000Z"
}
]

Response:

- Array con las solicitudes del usuario filtradas por estado

### 4. Ver todas las solicitudes que han recibido los viajes creados por el usuario (como creador)

Method: GET  
Url: /api/participants/my-creator-requests  
Headers: X  
Body: X

Response:

- Array con todas las solicitudes que han llegado a los viajes creados por el usuario

### 4.1 Ver solicitudes de mis viajes (creador) filtradas por estado

Method: GET  
Url: /api/participants/my-creator-requests?status={estado}  
Headers: X  
Body: X

Response:

- Array con las solicitudes a los viajes creados por el usuario, filtradas por estado

### 5. Crear una solicitud de participación para un viaje

Method: POST  
Url: /api/participants/:trip_id  
Headers: Content-Type: application/json  
Body:

{
"message": "Quiero unirme al viaje."
}

Ejemplo de respuesta:

{
"id_participation": 12,
"id_trip": 101,
"id_user": 1,
"status": "pending",
"message": "Quiero unirme al viaje.",
"created_at": "2025-11-17T18:26:28.000Z",
"updated_at": "2025-11-17T18:26:28.000Z"
}

Response:

- Objeto con la nueva solicitud creada (estado inicial: pending)

### 6. Cambiar el estado de una solicitud/participación

Method: PATCH  
Url: /api/participants/:participation_id  
Headers: Content-Type: application/json  
Body:

{
"status": "accepted"
}

o

{
"status": "rejected"
}

o

{
"status": "left"
}

Ejemplo de respuesta:

{
"id_participation": 12,
"id_trip": 101,
"id_user": 1,
"status": "accepted",
"message": "Quiero unirme al viaje.",
"created_at": "2025-11-17T18:26:28.000Z",
"updated_at": "2025-11-17T18:28:45.000Z"
}

Response:

- Objeto con la solicitud actualizada (estado y updated_at modificados)


### Eliminar una participacion solicitud

Method: DELETE  
Url: /api/participants/:participationId  
Headers: Token 


Response:
  -Mensaje de confirmación de borrado
  -ID de la participación borrada


### 7. Ver información de los usuarios aceptados de un viaje

Method: GET  
Url: /participants/trip-info/:trip_id
Headers:
Body:

Response:

- Devuelve la información de los usuarios de un viaje en el que han sido aceptados. Si no se envía token
  solo devuelve el id_user, name, photo_url, bio, interests y average_rating. Si tiene token, a demás
  añade el email y phone.

Ejemplo: GET {{URL}}/participants/trip-info/60

[
{
"id_user": 66,
"name": "Pedro Antonio Antoñez",
"photo_url": "https://example.com/photos/aoki.jpg",
"bio": "No se leer",
"interests": "Mi contraeña es: antoñito1",
"average_rating": 0,
"email": "antoñito1@example.com",
"phone": "+34 600500551"
},
{
"id_user": 59,
"name": "Pedro Antonio",
"photo_url": "https://example.com/photos/aoki.jpg",
"bio": "No se leer",
"interests": "Mi contraeña es: antoñito",
"average_rating": 0,
"email": "antoñito@example.com",
"phone": "+34 600500551"
}
]
