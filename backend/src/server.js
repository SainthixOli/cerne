require('dotenv').config();

// SECURITY: Validar environment ao startup
const { validateEnvironment } = require('./config/envValidator');
validateEnvironment();

const app = require('./app');

const { runHealthCheck } = require('./utils/healthCheck');

const PORT = process.env.PORT || 3000;

// Inicializar o Sistema verificando a saúde do banco e integridade
runHealthCheck().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
