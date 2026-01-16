const GoogleAPI = {
    tokenClient: null,
    gapiInited: false,
    gsiInited: false,

    init(callback) {
        const scriptGapi = document.createElement('script');
        scriptGapi.src = "https://apis.google.com/js/api.js";
        scriptGapi.onload = () => {
            gapi.load('client', async () => {
                await gapi.client.init({
                    apiKey: CONFIG.apiKey,
                    discoveryDocs: CONFIG.discovery
                });
                this.gapiInited = true;
                this.checkReady(callback);
            });
        };
        document.body.appendChild(scriptGapi);

        const scriptGsi = document.createElement('script');
        scriptGsi.src = "https://accounts.google.com/gsi/client";
        scriptGsi.onload = () => {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CONFIG.clientId,
                scope: CONFIG.scope,
                callback: ''
            });
            this.gsiInited = true;
            this.checkReady(callback);
        };
        document.body.appendChild(scriptGsi);
    },

    checkReady(callback) {
        if (this.gapiInited && this.gsiInited) {
            callback();
        }
    },

    login(callback) {
        this.tokenClient.callback = async (resp) => {
            if (resp.error) {
                console.error("Erro no Login:", resp.error);
                alert("Erro no Login: " + resp.error);
                return;
            }
            callback(resp);
        };
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
    },

    async getUserInfo() {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${gapi.client.getToken().access_token}` }
        });
        return await res.json();
    },

    logout() {
        const token = gapi.client.getToken();
        if (token) {
            google.accounts.oauth2.revoke(token.access_token);
        }
        location.reload();
    },

    async listFiles() {
        const res = await gapi.client.drive.files.list({
            pageSize: 50,
            fields: "files(id, name, createdTime, modifiedTime)",
            q: "name contains 'UNIARA_BP_' and trashed = false",
            orderBy: "modifiedTime desc"
        });
        return res.result.files;
    },

    async saveFile(name, data, fileId = null) {
        const fileMetadata = {
            name: `UNIARA_BP_${name}.json`,
            mimeType: 'application/json'
        };
        const fileContent = JSON.stringify(data);

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
        form.append('file', new Blob([fileContent], { type: 'application/json' }));

        const url = fileId
            ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
            : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        const method = fileId ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { Authorization: `Bearer ${gapi.client.getToken().access_token}` },
            body: form
        });
        return await res.json();
    },

    async getFile(fileId) {
        const res = await gapi.client.drive.files.get({ fileId: fileId, alt: 'media' });
        return res.result;
    },

    async deleteFile(fileId) {
        return await gapi.client.drive.files.delete({ fileId: fileId });
    }
};
