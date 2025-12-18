const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static('public'));

let accessToken = null;
const TOKEN_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

async function getAccessToken() {
    try {
        const response = await axios.post(
            'https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token',
            'grant_type=client_credentials',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'basic MzQ0NmNkNzI2OTRjNGE0NDg1ZDgxYjc3YWRiYjIxNDE6OTIwOWQ0YTVlMjVhNDU3ZmI5YjA3NDg5ZDMxM2I0MWE=' // Known public client ID for Fortnite
                }
            }
        );
        accessToken = response.data.access_token;
        console.log('Access Token Refreshed');
    } catch (error) {
        console.error('Error fetching access token:', error.message);
    }
}


getAccessToken();
setInterval(getAccessToken, TOKEN_REFRESH_INTERVAL);

app.get('/api/status', async (req, res) => {
    if (!accessToken) {
        return res.status(503).json({ message: 'Access token not available yet' });
    }

    try {
        const response = await axios.get(
            'https://lightswitch-public-service-prod.ol.epicgames.com/lightswitch/api/service/fortnite/status',
            {
                headers: {
                    'Authorization': `bearer ${accessToken}`
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching status:', error.message);
        res.status(500).json({ message: 'Error fetching status' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
