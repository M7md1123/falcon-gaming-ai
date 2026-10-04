// Every console line carries the AL0 Lab attribution.
const cfg = require('../config');
const PREFIX = '[Falcon Gaming AI | AL0 Lab]';
const stamp = () => new Date().toISOString();

module.exports = {
  info: (...a) => console.log(stamp(), PREFIX, 'INFO ', ...a),
  warn: (...a) => console.warn(stamp(), PREFIX, 'WARN ', ...a),
  error: (...a) => console.error(stamp(), PREFIX, 'ERROR', ...a),
  banner() {
    console.log('='.repeat(56));
    console.log(`  ${cfg.botName}`);
    console.log(`  ${cfg.brand}`);
    console.log('='.repeat(56));
  },
};
