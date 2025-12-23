const express = require('express');
const router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const fs = require("fs");

// Fonction pour nettoyer le numéro de téléphone
function formatPhoneNumber(number) {
    let cleaned = number.replace(/[^0-9]/g, '');
    return cleaned;
}

router.get('/', async (req, res) => {
    let number = req.query.number;

    if (!number) {
        return res.status(400).json({ error: "Veuillez fournir un numéro de téléphone (ex: ?number=225XXXXXXXX)" });
    }

    number = formatPhoneNumber(number);

    async function getPairingCode() {
        // Utilisation d'un dossier temporaire pour l'appairage afin de ne pas corrompre la session principale
        const { state, saveCreds } = await useMultiFileAuthState(`./temp_session_${Date.now()}`);
        
        try {
            // Création d'une instance temporaire devplag pour l'appairage
            let devplag = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
                },
                printQRInTerminal: false,
                logger: pino({ level: "fatal" }),
                browser: ["Ubuntu", "Chrome", "20.0.04"]
            });

            if (!devplag.authState.creds.registered) {
                await delay(1500); // Temps d'attente pour l'initialisation
                const code = await devplag.requestPairingCode(number);
                
                if (!res.headersSent) {
                    res.json({ code: code });
                }
            }

            devplag.ev.on('creds.update', saveCreds);
            
            devplag.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                if (connection === "open") {
                    console.log(`[PAIRING] Numéro ${number} connecté avec succès !`);
                    await delay(5000);
                    // Une fois connecté, on peut déplacer ou sauvegarder la session
                    // Note: Dans un déploiement réel, on enverrait les fichiers de session à l'utilisateur
                    process.exit(0); // On ferme le processus temporaire d'appairage
                }
                if (connection === "close") {
                    // Gestion des erreurs de connexion ici
                }
            });

        } catch (err) {
            console.error("Erreur Pairing:", err);
            if (!res.headersSent) {
                res.status(500).json({ error: "Erreur lors de la génération du code." });
            }
        }
    }

    await getPairingCode();
});

module.exports = router;