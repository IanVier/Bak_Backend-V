const router = require('express').Router();
const messages = require('../../controllers/messages.controller');

router.delete('/:messageId', messages.deleteMessage);

module.exports = router;
