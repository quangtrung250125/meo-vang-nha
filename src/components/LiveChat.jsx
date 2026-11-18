import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { getGuestChatKey, requestLiveChat } from '../services/liveChatApi';

const POLL_MS = 3000;

function useChatFeed(guestKey, threadId, field) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const refresh = useRef(() => {});

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    let pending = false;

    async function load() {
      if (pending || controller.signal.aborted) return;
      clearTimeout(timer);
      pending = true;
      try {
        const data = await requestLiveChat({ guestKey, threadId, signal: controller.signal });
        if (!controller.signal.aborted) {
          setItems(data[field]);
          setError('');
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      } finally {
        pending = false;
        if (!controller.signal.aborted) timer = setTimeout(load, POLL_MS);
      }
    }

    refresh.current = load;
    load();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [guestKey, threadId, field]);

  return { items, error, refresh };
}

function ChatThread({ guestKey, threadId }) {
  const { items, error, refresh } = useChatFeed(guestKey, threadId, 'messages');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const attempt = useRef(null);
  const log = useRef(null);
  const latestId = items?.at(-1)?.id;

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [latestId]);

  async function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError('');
    try {
      if (attempt.current?.text !== text) {
        attempt.current = { text, requestId: crypto.randomUUID() };
      }
      await requestLiveChat({ guestKey, threadId, message: attempt.current });
      attempt.current = null;
      setDraft('');
      refresh.current();
    } catch (error) {
      setSendError(error.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div ref={log} role="log" aria-label="Tin nhắn" className="flex-1 min-h-0 overflow-y-auto bg-slate-50 p-4 space-y-3">
        {!items && !error && <p className="text-sm text-slate-500">Đang tải tin nhắn…</p>}
        {items?.length === 0 && <p className="text-sm text-slate-600">Chào bạn! Bạn cần Mèo Vàng Nhà hỗ trợ gì?</p>}
        {items?.map((message) => {
          const mine = message.sender === (guestKey ? 'guest' : 'staff');
          return (
            <div key={message.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${mine ? 'bg-emerald-700 text-white' : 'bg-white text-slate-800'}`}>
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <time dateTime={message.created_at} className="mt-1 block text-xs opacity-80">
                  {new Date(message.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            </div>
          );
        })}
      </div>
      {(sendError || error) && <p role="status" className="px-3 py-2 text-xs text-rose-700">{sendError || error}</p>}
      <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-200 p-3">
        <textarea aria-label="Nội dung tin nhắn" placeholder="Nhập tin nhắn…" rows={2} maxLength={2000}
          value={draft} disabled={sending} onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form.requestSubmit();
            }
          }}
          className="min-w-0 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-base focus:outline-emerald-600" />
        <button type="submit" aria-label="Gửi tin nhắn" disabled={sending || !draft.trim()}
          className="rounded-xl bg-emerald-700 p-3 text-white disabled:opacity-40">
          <Send className="size-4" />
        </button>
      </form>
    </>
  );
}

export function FloatingLiveChat({ onOpenChange }) {
  const [open, setOpen] = useState(false);
  const [guestKey, setGuestKey] = useState(null);
  const [error, setError] = useState('');
  const launcher = useRef(null);
  const closeButton = useRef(null);

  useEffect(() => {
    if (open) closeButton.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    onOpenChange?.(false);
    launcher.current?.focus();
  }

  function toggle() {
    if (open) return close();
    try {
      setGuestKey(getGuestChatKey());
      setError('');
    } catch {
      setError('Không thể lưu phiên chat. Vui lòng cho phép trang web lưu dữ liệu trong trình duyệt.');
    }
    setOpen(true);
    onOpenChange?.(true);
  }

  return (
    <div className="pointer-events-auto">
      <button ref={launcher} type="button" id="btn-floating-live-chat" aria-label="Chat với nhân viên"
        title="Chat với nhân viên" aria-expanded={open} onClick={toggle}
        className="relative flex size-12 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition hover:scale-110 hover:bg-emerald-800 focus-visible:ring-4 focus-visible:ring-emerald-300 sm:size-14">
        <MessageCircle className="size-6 sm:size-7" />
      </button>
      {open && (
        <section role="dialog" aria-label="Chat với nhân viên" onKeyDown={(event) => { if (event.key === 'Escape') close(); }}
          className="fixed inset-x-3 bottom-3 z-10 flex h-[min(30rem,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:left-auto sm:right-24 sm:bottom-6 sm:w-96">
          <header className="flex items-center justify-between gap-3 bg-emerald-800 px-4 py-3 text-white">
            <div>
              <h2 className="font-bold">Chat với nhân viên</h2>
              <p className="text-xs text-emerald-100">Mèo Vàng Nhà</p>
            </div>
            <button ref={closeButton} type="button" aria-label="Đóng chat" onClick={close} className="rounded-lg p-2 hover:bg-white/15">
              <X className="size-5" />
            </button>
          </header>
          {guestKey ? <ChatThread guestKey={guestKey} /> : <p role="status" className="p-4 text-sm text-rose-700">{error}</p>}
        </section>
      )}
    </div>
  );
}

export function StaffLiveChat() {
  const { items, error } = useChatFeed(undefined, undefined, 'threads');
  const [selected, setSelected] = useState(null);
  const active = selected || items?.[0]?.thread_id;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white md:h-[640px] md:flex-row">
      <div className="max-h-52 overflow-y-auto border-b border-slate-200 md:max-h-none md:w-72 md:shrink-0 md:border-r md:border-b-0">
        <h3 className="px-4 py-3 font-bold text-slate-800">Cuộc trò chuyện trên web</h3>
        {error && <p role="status" className="px-4 pb-3 text-sm text-rose-700">{error}</p>}
        {!items && !error && <p className="px-4 pb-3 text-sm text-slate-500">Đang tải…</p>}
        {items?.length === 0 && <p className="px-4 pb-3 text-sm text-slate-500">Chưa có khách nhắn tin.</p>}
        {items?.map((thread) => (
          <button key={thread.thread_id} type="button" aria-pressed={active === thread.thread_id}
            onClick={() => setSelected(thread.thread_id)}
            className="block w-full border-t border-slate-100 px-4 py-3 text-left hover:bg-slate-50 aria-pressed:bg-emerald-50">
            <span className="block text-sm font-semibold">Khách #{thread.thread_id.slice(0, 8)}</span>
            <span className={`block truncate text-xs ${thread.sender === 'guest' ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
              {thread.sender === 'staff' ? 'Nhân viên: ' : ''}{thread.body}
            </span>
          </button>
        ))}
      </div>
      <div className="flex h-[26rem] min-w-0 flex-1 flex-col md:h-auto">
        {active ? (
          <>
            <h3 className="border-b border-slate-200 px-4 py-3 text-sm font-bold">Khách #{active.slice(0, 8)}</h3>
            <ChatThread key={active} threadId={active} />
          </>
        ) : <p className="p-4 text-sm text-slate-500">Chọn một cuộc trò chuyện để trả lời.</p>}
      </div>
    </div>
  );
}