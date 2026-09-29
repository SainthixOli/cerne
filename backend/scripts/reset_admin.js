const { runProvision } = require('./userProvisioning');

runProvision({ prefix: 'CERNE_ADMIN', role: 'admin', name: 'Administrador', updateOnly: true });
