require('dotenv').config();
const { IpFilter, IpDeniedError } = require('express-ipfilter');

// 환경 변수에서 IP 리스트를 가져옴
const ips = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [];

// IP 유효성 검사
if (ips.length === 0) {
  console.error('No IP addresses specified in ALLOWED_IPS environment variable.');
  process.exit(1);
}

console.log(`Allowed IPs: ${ips.join(', ')}`);

// IP 필터 미들웨어 생성
const ipFilterMiddleware = IpFilter(ips, { mode: 'allow' });

// IP 필터 오류 처리 미들웨어
const ipFilterErrorHandler = (err, req, res, next) => {  // req 추가
  if (err instanceof IpDeniedError) {
    res.status(403).json({ message: 'Access forbidden: Unauthorized IP' });
  } else {
    next(err);
  }
};

module.exports = { ipFilterMiddleware, ipFilterErrorHandler };