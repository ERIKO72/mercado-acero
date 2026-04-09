const express = require('express');
const { getStores } = require('../controllers/storesController');

const router = express.Router();

router.get('/', getStores);

module.exports = router;
