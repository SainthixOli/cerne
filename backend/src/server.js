require('dotenv').config();
const app = require('./app');

const { runHealthCheck } = require('./utils/healthCheck');

const PORT = process.env.PORT || 3000;

// Initialize System
runHealthCheck().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
