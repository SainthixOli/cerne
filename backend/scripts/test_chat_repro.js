const { requireScriptEnv } = require('./scriptEnv');

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testChat() {
    try {
        const affiliationId = requireScriptEnv('TEST_AFFILIATION_ID');
        const cpf = requireScriptEnv('TEST_CPF');

        const get = async (url, headers) => {
            const response = await fetch(url, { headers });
            const data = await response.json().catch(() => ({}));
            return { status: response.status, data };
        };

        const post = async (url, body, headers) => {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify(body),
            });
            return { status: response.status };
        };

        const messages = await get(
            `${BASE_URL}/affiliations/${encodeURIComponent(affiliationId)}/chat`,
            { 'x-cpf': cpf }
        );
        console.log('Fetch status:', messages.status);
        console.log('Message count:', Array.isArray(messages.data) ? messages.data.length : 0);

        const sent = await post(
            `${BASE_URL}/affiliations/${encodeURIComponent(affiliationId)}/chat`,
            { message: `Test Message via Script ${Date.now()}` },
            { 'x-cpf': cpf }
        );
        console.log('Send status:', sent.status);
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exitCode = 1;
    }
}

testChat();
