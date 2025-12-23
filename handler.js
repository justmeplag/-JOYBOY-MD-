module.exports = async (devplag, m) => {
    try {
        const body = m.body.toLowerCase();
        const from = m.chat;

        // Log simple en français
        console.log(`[MSG] De: ${m.sender} | Contenu: ${m.body}`);

        // Exemple de réponse automatique pour tester la base
        if (body === 'ping') {
            await m.reply("Pong! 🏓 JOYBOY-MD est opérationnel.");
            await m.react("🔥");
        }

    } catch (e) {
        console.error("Erreur Handler:", e);
    }
};