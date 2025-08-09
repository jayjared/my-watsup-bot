const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Create bot with saved auth session
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

// Show QR for login
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Zion Gardens Hotel WhatsApp Bot is ready!');
});

// Receptionist number
const receptionistNumber = "254798596533@c.us"; // Kenya format without +

let greetedUsers = new Set();

// Hotel intro message
const hotelIntro = `
🏨 *Welcome to Zion Gardens Hotel* – Haven of Comfort and Luxury 🌟

We offer:
- 🛏️ Elegant Rooms
- 🍽️ Restaurant with diverse menu
- 🏊 Swimming Pool
- 🎉 Event Hosting & Conferences
- 🚗 Secure Parking

💰 *Prices*:
- standard Room: KES 3,500/night
- deluxe Room: KES 4,500/night
- executive room: KES 6,500/night
- Conference Hall: From KES 15,000/day

Reply *YES* if you'd like to connect with our receptionist.
`;

// Handle messages
client.on('message', async msg => {
    const chatId = msg.from;

    // First time greeting
    if (!greetedUsers.has(chatId)) {
        greetedUsers.add(chatId);

        // Send intro text
        await client.sendMessage(chatId, hotelIntro);

        // Send images
        const menu = MessageMedia.fromFilePath('./media/menu.jpg');
        const room1 = MessageMedia.fromFilePath('./media/room1.jpg');
        const room2 = MessageMedia.fromFilePath('./media/room2.jpg');

        await client.sendMessage(chatId, menu, { caption: "📜 Our Menu" });
        await client.sendMessage(chatId, room1, { caption: "🏨 Deluxe Room" });
        await client.sendMessage(chatId, room2, { caption: "🏨 Executive Room" });

        return;
    }

    // If user says YES → forward to receptionist
    if (msg.body.trim().toLowerCase() === "yes") {
        await client.sendMessage(chatId, "✅ Connecting you to our receptionist now…");

        const contact = await msg.getContact();
        const guestName = contact.pushname || "Guest";

        const forwardMsg = `📩 *New Booking Request from WhatsApp Bot*
Name: ${guestName}
Number: ${contact.number}
Message: Interested in booking at Zion Gardens Hotel.`;

        await client.sendMessage(receptionistNumber, forwardMsg);
    }
});

client.initialize();

