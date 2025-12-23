const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    jidDecode
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const { smsg } = require("./lib/simple");

const app = express();
const PORT = process.env.PORT || 8000;

// Utilitaire pour décoder les JID
const decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return decode.user && decode.server && decode.user + "@" + decode.server || jid;
    } else return jid;
};

async function startJoyBoy() {
    const { state, saveCreds } = await useMultiFileAuthState('session');

    const devplag = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        printQRInTerminal: true,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.4"]
    });

    devplag.decodeJid = decodeJid;

    devplag.ev.on('creds.update', saveCreds);

    devplag.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = lastDisconnect?.error?.output?.statusCode;
            console.log(`Connexion fermée (Raison: ${reason}). Reconnexion en cours...`);
            if (reason !== DisconnectReason.loggedOut) startJoyBoy();
        } else if (connection === 'open') {
            console.log('✅ JOYBOY-MD (devplag) est connecté !');
        }
    });

    devplag.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            let m = chatUpdate.messages[0];
            if (!m.message || m.key.remoteJid === 'status@broadcast') return;
            
            // Transformation du message
            m = smsg(devplag, m);
            
            // Envoi vers le gestionnaire
            require('./handler')(devplag, m);
        } catch (err) {
            console.error("Erreur de traitement message:", err);
        }
    });

    return devplag;
}

startJoyBoy();

// Garder le bot éveillé sur Render
app.get('/', (req, res) => res.send("JOYBOY-MD est en ligne."));
app.listen(PORT, () => console.log(`Serveur Web actif sur le port ${PORT}`));