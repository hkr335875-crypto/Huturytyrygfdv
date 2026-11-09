/**
 * سرویس ارتباط با API پیام‌رسان بله و پردازش دستورات مدیریتی
 */

export interface BaleBotInfo {
  id?: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
}

export async function fetchBaleBotInfo(token: string): Promise<{ success: boolean; data?: BaleBotInfo; error?: string }> {
  try {
    const res = await fetch(`/api/bale/status?token=${encodeURIComponent(token)}`);
    const json = await res.json();
    if (json.success && json.data && json.data.ok) {
      return { success: true, data: json.data.result };
    }
    return { success: false, error: json.error || 'توکن نامعتبر است یا ارتباط با بله برقرار نشد' };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطای شبکه در اتصال به بله' };
  }
}

export async function sendBaleMessage(
  token: string,
  chatId: string,
  text: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch('/api/bale/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, chatId, text }),
    });
    const json = await res.json();
    if (json.success && json.data && json.data.ok) {
      return { success: true, data: json.data.result };
    }
    return { success: false, error: json.error || json.data?.description || 'خطا در ارسال به بله' };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطای سرور در ارسال پیام' };
  }
}
