const router = require('express').Router();
const users = require('../../controllers/users.controller');

// GET /api/usuarios
router.get('/', users.getAll);
router.get('/:userId', users.getById);
router.get('/email/:email', users.getByEmail);
router.patch('/:userId', users.update);
router.put('/:userId', users.update);
router.delete('/:userId', users.remove);

module.exports = router;
