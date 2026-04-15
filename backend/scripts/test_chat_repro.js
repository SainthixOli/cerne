
const BASE_URL = 'http://localhost:3000/api';

async function testChat() {
    try {
        console.log("--- TEST START ---");

        const FILIACAO_ID = 13;
        const CPF = '676.767.676-76';
        const CPF_CLEAN = '67676767676';

        // Helper for fetch
        const get = async (url, headers) => {
            const res = await fetch(url, { headers });
            const data = await res.json().catch(() => ({}));
            return { status: res.status, data };
        }

        const post = async (url, body, headers) => {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify(body)
            });
            const data = await res.json().catch(() => ({}));
            return { status: res.status, data };
        }

        // 1. FETCH MESSAGES (Public)
        console.log(`Fetching messages for ID ${FILIACAO_ID} with CPF ${CPF}`);
        const res1 = await get(`${BASE_URL}/affiliations/${FILIACAO_ID}/chat`, { 'x-cpf': CPF });
        console.log("Fetch Result (Formatted CPF):", res1.status, `Count: ${Array.isArray(res1.data) ? res1.data.length : 'Error'}`);

        console.log(`Fetching messages for ID ${FILIACAO_ID} with CLEAN CPF ${CPF_CLEAN}`);
        const res2 = await get(`${BASE_URL}/affiliations/${FILIACAO_ID}/chat`, { 'x-cpf': CPF_CLEAN });
        console.log("Fetch Result (Clean CPF):", res2.status, `Count: ${Array.isArray(res2.data) ? res2.data.length : 'Error'}`);

        // 2. SEND MESSAGE (Public)
        console.log("Sending message as PUBLIC USER...");
        const res3 = await post(`${BASE_URL}/affiliations/${FILIACAO_ID}/chat`, {
            message: "Test Message via Script " + Date.now()
        }, { 'x-cpf': CPF });
        console.log("Send Result:", res3.status, res3.data);

        console.log("--- TEST END ---");

    } catch (error) {
        console.error("TEST CRASHED:", error);
    }
}

testChat();
