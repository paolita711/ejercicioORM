const httpStatus = require('../utils/httpStatus');

const check = (req, res) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: 'API operativa',
    data: { status: 'ok' }
  });
};

module.exports = { check };
