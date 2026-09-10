import { beginSend, markSent, markSendFailed } from './core.js';

export async function sendOne(lead, endpoint) {
  if (!endpoint) throw new Error('لم يتم إعداد رابط الإرسال');
  const locked = beginSend(lead);
  try {
    const response = await fetch(endpoint, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({lead: locked})
    });
    if (!response.ok) throw new Error(`فشل الإرسال: HTTP ${response.status}`);
    const result = await response.json();
    return markSent(locked, result);
  } catch (error) {
    markSendFailed(locked);
    throw error;
  }
}

export async function sendBatch(leads, endpoint, limit = 5) {
  if (leads.length > limit) throw new Error(`الحد الأقصى للدفعة ${limit} Leads`);
  const results = [];
  for (const lead of leads) {
    try { results.push({ok:true, lead:await sendOne(lead, endpoint)}); }
    catch (error) { results.push({ok:false, lead, error:error.message}); }
  }
  return results;
}
