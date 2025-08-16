import axios from 'axios';
import FormData from 'form-data';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from './config.js';
<<<<<<< HEAD
import { sleep } from './utils.js';
import { logWarn, logError } from './logger.js';

async function _post(path, body, isForm=false){ if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return; const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${path}`; for (let i=0;i<4;i++){ try{ const res = await axios.post(url, body, { headers: isForm? body.getHeaders() : undefined, timeout: 15000 }); if (res.data && res.data.ok) return res.data; throw new Error('tg err'); }catch(e){ logWarn('tg post failed attempt '+(i+1)); await sleep(500 * (i+1)); } } logError('telegram failed after retries'); }

export async function sendTelegramText(msg){ if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return; const payload = { chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: 'Markdown', disable_web_page_preview:true }; return await _post('sendMessage', payload); }

export async function sendTelegramPhotoBuffer(buffer, caption){ if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return; const form = new FormData(); form.append('chat_id', TELEGRAM_CHAT_ID); form.append('caption', caption); form.append('parse_mode', 'Markdown'); form.append('photo', buffer, { filename: 'signal.png', contentType: 'image/png' }); return await _post('sendPhoto', form, true); }
=======

export async function sendTelegramText(msg){
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: msg,
      parse_mode: 'Markdown'
    });
  } catch (e) { console.error('sendTelegramText err', e?.response?.data || e?.message || e); }
}

export async function sendTelegramPhotoBuffer(buffer, caption){
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    const form = new FormData();
    form.append('chat_id', TELEGRAM_CHAT_ID);
    form.append('caption', caption);
    form.append('parse_mode', 'Markdown');
    form.append('photo', buffer, { filename: 'signal.png', contentType: 'image/png' });
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, form, { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity });
  } catch (e) { console.error('sendTelegramPhotoBuffer err', e?.response?.data || e?.message || e); }
}
>>>>>>> 59f769cb3bc345dab8c09e78d07038b32c1ed172
