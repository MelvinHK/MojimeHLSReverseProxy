const express = require('express');
const axios = require('axios');
const app = express();

app.get("/", (_req, res) => res.send("Running reverse proxy."));

app.use('/proxy/:url(*)', async (req, res) => {
    try {
        const response = await axios.get(req.params.url, {
            responseType: 'stream',
        });
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        response.data.pipe(res);
    } catch (error) {
        res.status(error.response?.status || 500).send('Error fetching content');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));