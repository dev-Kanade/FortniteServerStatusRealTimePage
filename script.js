const OAUTH_URL = 'https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token';
const STATUS_URL = 'https://lightswitch-public-service-prod.ol.epicgames.com/lightswitch/api/service/bulk/status?serviceId=Fortnite';

// Fortnite PC Client Credentials
const CLIENT_ID = 'ec684b8c687f479fadea3cb2ad83f5c6';
const CLIENT_SECRET = 'e1f31c211f28413186262d37a13fc84d';

let accessToken = null;

async function getAccessToken() {
    try {
        const response = await fetch(OAUTH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // Calculate Base64 of CLIENT_ID:CLIENT_SECRET
                'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token fetch failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        accessToken = data.access_token;
        console.log('Access Token Refreshed', new Date().toLocaleTimeString());
    } catch (error) {
        console.error('Error fetching access token:', error);
    }
}

async function fetchStatus() {
    if (!accessToken) {
        // Retry getting token if missing (e.g. initial load failed)
        await getAccessToken();
        if (!accessToken) return;
    }

    try {
        const response = await fetch(STATUS_URL, {
            method: 'GET',
            headers: {
                'Authorization': `bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            // If 401, maybe token expired? Refresh immediately
            if (response.status === 401) {
                await getAccessToken();
                return; // Skip this tick, wait for next or recurse
            }
            throw new Error(`Status fetch failed: ${response.status}`);
        }

        const data = await response.json();
        updateUI(data);

    } catch (error) {
        console.error('Error fetching status:', error);
        // Optional logic: show error state if persistent
    }
}

function updateUI(data) {
    const card = document.getElementById('statusCard');
    const text = document.getElementById('statusText');

    // Bulk status returns an array of services. Find "Fortnite".
    // Example: [{ serviceInstanceId: 'fortnite', status: 'UP', ... }]
    const fortniteService = Array.isArray(data) ? data.find(s => s.serviceInstanceId === 'fortnite') : data;

    if (fortniteService && fortniteService.status === 'UP') {
        card.classList.remove('offline');
        card.classList.add('online');
        text.textContent = 'Online';
    } else {
        card.classList.remove('online');
        card.classList.add('offline');
        text.textContent = 'Offline';
    }
}

// Initial Setup
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const STATUS_POLL_INTERVAL = 1000; // 1 second

// Start
getAccessToken().then(() => {
    fetchStatus(); // First status check immediately after token
});

setInterval(getAccessToken, TOKEN_REFRESH_INTERVAL);
setInterval(fetchStatus, STATUS_POLL_INTERVAL);
