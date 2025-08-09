// index.js
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// receptionist in Kenya format
const RECEPTIONIST_NUMBER = '254798596533@c.us'; // 0798596533 -> 254798596533@c.us

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

const greeted = new Set(); // tracks which chats got the intro (in-memory)

// hotel content
const HOTEL_INTRO = `🏨 *Zion Gardens Hotel* — *Haven of Comfort and Luxury*

Welcome! We offer:
- 🛏️ Accommodation (Standard, Deluxe, Executive)
- 🍽️ Restaurant & Bar
- 🏊 Swimming Pool
- 🎉 Events & Conferences
- 🚗 Secure Parking

*Prices:*
- Standard: KES 3,500/night
- Deluxe: KES 4,500/night
- Executive Suite: KES 6,500/night

Reply *YES* (or type "reception") if you'd like me to connect you to our receptionist.`;

client.on('qr', qr => {
  console.log('Scan this QR code to log in:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Zion Gardens Hotel Bot ready!');
});

client.on('message', async msg => {
  try {
    const chatId = msg.from; // e.g., "2547...@c.us"
    const text = (msg.body || '').trim();

    // 1) Auto-introduction (first time this chat sends a message)
    if (!greeted.has(chatId)) {
      greeted.add(chatId);

      // send intro text
      await client.sendMessage(chatId, HOTEL_INTRO);

      // send images if present in repo/media
      try {
        const menu = MessageMedia.fromFilePath('./media/menu.jpg');
        await client.sendMessage(chatId, menu, { caption: '📜 Our Menu' });
      } catch (e) {
        console.log('menu image not found or error sending menu:', e.message);
      }

      try {
        const r1 = MessageMedia.fromFilePath('./media/room1.jpg');
        const r2 = MessageMedia.fromFilePath('./media/room2.jpg');
        await client.sendMessage(chatId, r1, { caption: '🏨 Deluxe Room - KES 5,000/night' });
        await client.sendMessage(chatId, r2, { caption: '🏨 Executive Suite - KES 8,500/night' });
      } catch (e) {
        console.log('room images not found or error sending rooms:', e.message);
      }
      return; // done with auto-intro
    }

    // 2) If user wants receptionist (YES / reception / connect)
    const lc = text.toLowerCase();
    if (lc === 'yes' || lc.includes('reception') || lc.includes('connect')) {
      // confirm to guest
      await client.sendMessage(chatId, '✅ Connecting you to our receptionist now…');

      // collect guest info
      const contact = await msg.getContact();
      const guestName = contact.pushname || 'Guest';
      const guestNumber = contact.number || msg.from; // fallback

      const forward = `📩 *New Booking Request (via bot)*\nName: ${guestName}\nNumber: ${guestNumber}\nMessage: ${text}`;

      // send to receptionist
      await client.sendMessage(RECEPTIONIST_NUMBER, forward);

      // optional: notify guest that receptionist was notified
      await client.sendMessage(chatId, '📞 Our receptionist has been notified and will contact you shortly.');
      return;
    }

    // 3) Command-style quick answers
    if (lc === '!about' || lc === 'about') {
      await client.sendMessage(chatId, HOTEL_INTRO);
      return;
    }

    if (lc === '!services' || lc === 'services') {
      await client.sendMessage(chatId, '🛎️ Services: Accommodation, Restaurant & Bar, Events, Conference Halls, Airport Transfer.');
      return;
    }

    if (lc === '!prices' || lc === 'prices') {
      await client.sendMessage(chatId, '💰 Prices: Standard KES 3,500 | Deluxe KES 5,000 | Executive KES 8,500');
      return;
    }

    if (lc === '!menu' || lc === 'menu') {
      try {
        const menu = MessageMedia.fromFilePath('./media/menu.jpg');
        await client.sendMessage(chatId, menu, { caption: '🍽️ Our Menu' });
      } catch {
        await client.sendMessage(chatId, 'Menu image not available right now.');
      }
      return;
    }

    if (lc === '!rooms' || lc === 'rooms') {
      try {
        const r1 = MessageMedia.fromFilePath('./media/room1.jpg');
        const r2 = MessageMedia.fromFilePath('./media/room2.jpg');
        await client.sendMessage(chatId, r1);
        await client.sendMessage(chatId, r2);
      } catch {
        await client.sendMessage(chatId, 'Room images are not available right now.');
      }
      return;
    }

    // 4) Fallback friendly message
    await client.sendMessage(chatId, `I can help with:
- Type *!about* for hotel intro
- *!services* for services
- *!prices* for prices
- *!menu* or *!rooms* to see images
- Type *YES* to connect to receptionist.`);
  } catch (err) {
    console.error('Error handling message:', err);
  }
});

client.initialize();

