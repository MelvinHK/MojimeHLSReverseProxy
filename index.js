const express = require('express');
const axios = require('axios');
const app = express();

app.get("/", (_req, res) => res.send("Running reverse proxy."));

app.use('/proxy/:url(*)', async (req, res) => {
    try {
        const targetUrl = decodeURIComponent(req.params.url);
        res.set('Access-Control-Allow-Origin', '*'); // Remove CORS

        if (targetUrl.endsWith('.m3u8')) {
            const response = await axios.get(targetUrl);
            let m3u8Content = response.data;

            // Rewrite segment paths
            const baseUrl = req.protocol + '://' + req.get('host') + '/proxy/' + encodeURIComponent(targetUrl.substring(0, targetUrl.lastIndexOf('/')));
            m3u8Content = m3u8Content.replace(
                /(ep\.[^\s]+)/g, // Matches segment paths like "ep.200.1709248990.7200.ts"
                `${baseUrl}/$1`  // Prepends the proxy base URL
            );

            res.set('Content-Type', 'application/vnd.apple.mpegurl'); // Correct MIME type for .m3u8
            res.send(m3u8Content);
        } else {
            // If not .m3u8, stream .ts segments.
            const response = await axios.get(targetUrl, {
                responseType: 'stream',
            });
            response.data.pipe(res);
        }
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(error.response?.status || 500).send('Error fetching content');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));