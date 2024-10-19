require('dotenv').config();
const { IpFilter, IpDeniedError } = require('express-ipfilter');

const ips = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [];

if (ips.length === 0) {
  console.error('No IP addresses specified in ALLOWED_IPS environment variable.');
  process.exit(1);
}

console.log(`Allowed IPs: ${ips.join(', ')}`);

const ipFilterMiddleware = IpFilter(ips, { mode: 'allow' });

const ipFilterErrorHandler = (err, req, res, next) => {
  if (err instanceof IpDeniedError) {
    res.status(403).json({ message: 'Access forbidden: Unauthorized IP' });
  } else {
    next(err);
  }
};

module.exports = { ipFilterMiddleware, ipFilterErrorHandler };