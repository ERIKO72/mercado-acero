const express = require('express');
const { getServices } = require('../controllers/servicesController');

const router = express.Router();

router.get('/', getServices);

module.exports = router;
