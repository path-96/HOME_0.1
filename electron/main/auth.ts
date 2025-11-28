import { ipcMain, shell } from 'electron';
import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import destroyer from 'server-destroy';

const GOOGLE_CALLBACK_URL = 'http://localhost:3000/oauth2callback';

// These should be loaded from env variables in a real app
// For now, we'll expect them to be passed or loaded from process.env
let oauth2Client: any = null;

export function setupAuth(mainWindow: Electron.BrowserWindow) {
    ipcMain.handle('auth-google', async (_, { clientId, clientSecret }) => {
        if (!clientId || !clientSecret) {
            throw new Error('Missing Google Client ID or Secret');
        }

        oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            GOOGLE_CALLBACK_URL
        );

        const scopes = [
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events.readonly'
        ];

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
        });

        shell.openExternal(authUrl);

        return new Promise((resolve, reject) => {
            const server = http.createServer(async (req, res) => {
                try {
                    if (req.url!.indexOf('/oauth2callback') > -1) {
                        const qs = new url.URL(req.url!, 'http://localhost:3000').searchParams;
                        const code = qs.get('code');
                        res.end('Authentication successful! You can close this window.');
                        // @ts-ignore
                        server.destroy();

                        const { tokens } = await oauth2Client.getToken(code);
                        oauth2Client.setCredentials(tokens);
                        resolve(tokens);
                    }
                } catch (e) {
                    reject(e);
                }
            }).listen(3000, () => {
                console.log('Listening for OAuth2 callback on port 3000');
            });

            // @ts-ignore
            destroyer(server);
        });
    });

    ipcMain.handle('get-calendar-events', async (_, { tokens, clientId, clientSecret }) => {
        if (!oauth2Client && clientId && clientSecret) {
            oauth2Client = new google.auth.OAuth2(clientId, clientSecret, GOOGLE_CALLBACK_URL);
        }

        if (!oauth2Client) {
            throw new Error('OAuth client not initialized and credentials not provided');
        }

        if (tokens) {
            oauth2Client.setCredentials(tokens);
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        try {
            const res = await calendar.events.list({
                calendarId: 'primary',
                timeMin: (new Date()).toISOString(),
                maxResults: 20,
                singleEvents: true,
                orderBy: 'startTime',
            });
            return res.data.items;
        } catch (error) {
            console.error('The API returned an error: ' + error);
            throw error;
        }
    });
}
