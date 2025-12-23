const { jidDecode, extractMessageContent } = require("@whiskeysockets/baileys");

function smsg(devplag, m) {
    if (!m) return m;
    if (m.key) {
        m.id = m.key.id;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = devplag.decodeJid(m.fromMe ? devplag.user.id : (m.key.participant || m.key.remoteJid || ''));
    }
    if (m.message) {
        m.mtype = Object.keys(m.message)[0];
        m.msg = extractMessageContent(m.message[m.mtype]);
        m.body = (m.mtype === 'conversation') ? m.message.conversation :
                 (m.mtype === 'imageMessage') ? m.message.imageMessage.caption :
                 (m.mtype === 'videoMessage') ? m.message.videoMessage.caption :
                 (m.mtype === 'extendedTextMessage') ? m.message.extendedTextMessage.text :
                 (m.mtype === 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId :
                 (m.mtype === 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : m.text || '';
        
        let quoted = m.msg?.contextInfo ? m.msg.contextInfo.quotedMessage : null;
        if (quoted) {
            m.quoted = {};
            m.quoted.mtype = Object.keys(quoted)[0];
            m.quoted.msg = extractMessageContent(quoted[m.quoted.mtype]);
            m.quoted.sender = devplag.decodeJid(m.msg.contextInfo.participant);
            m.quoted.text = m.quoted.msg?.text || m.quoted.msg?.caption || '';
            m.quoted.delete = () => devplag.sendMessage(m.chat, { delete: m.key });
        }
    }
    m.reply = (text) => devplag.sendMessage(m.chat, { text: text }, { quoted: m });
    m.react = (emoji) => devplag.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
    return m;
}

module.exports = { smsg };
