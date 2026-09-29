const { runProvision } = require('./userProvisioning');

runProvision({ prefix: 'CERNE_SUPER_ADMIN', role: 'super_admin', name: 'Super Admin' });
