const router = require('express').Router();
const auth = require('../../controllers/auth.controller'); 

router.post('/new-user', auth.create);
router.post('/login', auth.login);
router.get('/verify', auth.verify);


module.exports = router;