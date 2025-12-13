const MessagesModel = require('../models/messages.model');

/**
 * 1. Obtener mensajes de un viaje (lista plana)
 * GET /api/trips/:tripId/messages
 */
const getMessagesByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const messages = await MessagesModel.selectMessagesByTrip(tripId);

    return res.json(messages);
  } catch (error) {
    console.error('Error in getMessagesByTrip:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 2. Obtener mensajes de un viaje en formato árbol
 * GET /api/messages/trip/:trip_id/tree
 */
const getMessagesTreeByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const map = new Map();
    const three = [];

    const messages = await MessagesModel.selectMessagesByTrip(tripId);

    // nodos base
    messages.forEach((msg) => {
      map.set(msg.id_message, { ...msg, replies: [] });
    });

    //   padres y hijos
    messages.forEach((msg) => {
      const node = map.get(msg.id_message);

      if (msg.id_parent_message && map.has(msg.id_parent_message)) {
        const parentNode = map.get(msg.id_parent_message);
        parentNode.replies.push(node);
      } else {
        three.push(node);
      }
    });

    return res.json(three);
  } catch (error) {
    console.error('Error al generar arbol', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 3. Mensaje por ID
 * GET /api/messages/:message_id
 */
const getMessageById = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await MessagesModel.selectMessageById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    return res.json(message);
  } catch (error) {
    console.error('Error in getMessageById:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 4. Crear un mensaje
 * POST /api/messages/trip/:trip_id
 *  {
 *    "content": "Esto es un mensaje",
 *    "parent_message_id": 123  // opcional
 *  }
 */
const createMessage = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { tripId } = req.params;

    const { message, id_parent_message = null } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Mensaje máximo 1000 caracteres' });
    }

    if (id_parent_message !== null && id_parent_message !== undefined) {
      const parent = await MessagesModel.selectMessageById(id_parent_message);

      if (!parent) return res.status(404).json({ error: 'Mensaje padre no encontrado' });

      if (Number(parent.id_trip) !== Number(tripId)) {
        return res.status(400).json({ error: 'El mensaje padre no pertenece a este viaje' });
      }
    }

    const insertId = await MessagesModel.insertMessage({
      id_trip: tripId,
      id_author: userId,
      id_parent_message: id_parent_message ?? null,
      content: message,
    });

    const newMessage = await MessagesModel.selectMessageById(insertId);
    return res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error in createMessage:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 5. Editar  un mensaje
 * PATCH /api/messages/:message_id
 *  {
 *    "content": "Nuevo texto"
 *  }
 */
const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required' });
    }

    const existing = await MessagesModel.selectMessageById(messageId);
    if (!existing) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const affectedRows = await MessagesModel.updateMessageContent(messageId, content);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const updated = await MessagesModel.selectMessageById(messageId);
    return res.json(updated);
  } catch (error) {
    console.error('Error in updateMessage:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * 6. Borrar un mensaje
 * DELETE /api/messages/:message_id
 *
 * Si no tiene hijos: DELETE total de la fila
 * Si tiene hijos: BORRADO LOGICO  (content = "[Deletet Message]")
 */
const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id_user;
    const { messageId } = req.params;

    const existing = await MessagesModel.selectMessageById(messageId);
    if (!existing) {
      return res.status(404).json({ error: 'Mensaje no encontrado' });
    }

    if (Number(existing.id_user) !== Number(userId)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este mensaje' });
    }

    const children = await MessagesModel.hasChildren(messageId);

    if (children) {
      await MessagesModel.softDeleteMessage(messageId);
    } else {
      await MessagesModel.deleteMessageHard(messageId);
    }

    return res.status(200).json({ message: 'Mensaje borrado:', deleted: existing });
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getMessagesByTrip,
  getMessagesTreeByTrip,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
};
