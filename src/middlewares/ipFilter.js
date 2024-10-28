require('dotenv').config();
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

// IP 필터 미들웨어 설정
const ipFilterMiddleware = IpFilter(ips, { mode: 'allow' });

const ipFilterErrorHandler = (err, req, res, next) => {
  if (err instanceof IpDeniedError) {
    res.status(403).json({ message: 'Access forbidden: Unauthorized IP' });
  } else {
    next(err);
  }
};

const logRequestWithIpName = (req, res, next) => {
  const ip = req.ip;
  const name = ipNameMap[ip] || ip;
  console.log(`Access granted to: ${name}`);
  next();
};

module.exports = { ipFilterMiddleware, ipFilterErrorHandler, logRequestWithIpName };