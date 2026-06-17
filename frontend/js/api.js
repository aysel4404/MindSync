
const MindSyncAPI = {
    
    async post(url, payload) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (err) {
            console.error(`Error executing POST: ${url}`, err);
            return { success: false, message: "Network synchronization error." };
        }
    },

   
    async get(url) {
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (err) {
            console.error(`Error executing GET: ${url}`, err);
            return null;
        }
    }
};

window.MindSyncAPI = MindSyncAPI;
