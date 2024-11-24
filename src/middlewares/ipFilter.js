const { IpFilter, IpDeniedError } = require('express-ipfilter');

const ips = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [];

const ipNameMap = {};
if (process.env.IP_NAMES) {
  process.env.IP_NAMES.split(',').forEach(pair => {
    const [ip, name] = pair.split(':');
    ipNameMap[ip] = name;
  });
}

if (ips.length === 0) {
  console.error('No IP addresses specified in ALLOWED_IPS environment variable.');
  process.exit(1);
}

const ipFilterMiddleware = IpFilter(ips, { mode: 'allow' });

const ipFilterErrorHandler = (err, req, res, next) => {
  if (err instanceof IpDeniedError) {
    res.status(403).json({ message: 'Access forbidden: Unauthorized IP' });
  } else {
    next(err);
  }
};

module.exports = { ipFilterMiddleware, ipFilterErrorHandler };