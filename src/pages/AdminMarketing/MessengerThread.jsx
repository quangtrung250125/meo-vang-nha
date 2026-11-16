import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Link2, Unlink, AlertTriangle, Paperclip } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { normalizeVnPhone } from '../../utils/phone';
import { DEFAULT_SITE_URL } from '../../utils/orderSource';
import { Avatar, ChannelTag, ProfileLink, fmtTime, phonesInText } from './inboxShared';

const DAY_MS = 86400000;

const Attachment = ({ a }) => {
  if (a.type === 'image' && a.url) {
    return <a href={a.url} target="_blank" rel="noreferrer"><img src={a.url} alt="Ảnh khách gửi" referrerPolicy="no-referrer" className="mt-1 max-h-48 rounded-lg" /></a>;
  }
  return a.url
    ? <a href={a.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline"><Paperclip className="h-3 w-3" />Tệp đính kèm ({a.type})</a>
    : <span className="inline-flex items-center gap-1 italic"><Paperclip className="h-3 w-3" />{a.type}</span>;
};

// Bôi màu link trong tin để nhân viên thấy link đã được gắn mã nguồn
const withLinks = (text) => String(text || '').split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
  /^https?:\/\//.test(part)
    ? <a key={i} href={part} target="_blank" rel="noreferrer" className="underline break-all">{part}</a>
    : <React.Fragment key={i}>{part}</React.Fragment>);

/**
 * Cuộc trò chuyện Messenger: tin khách nhắn Fanpage và tin trả lời, gắn tài khoản web, trả lời ngay tại đây.
 */
const MessengerThread = ({ conv, customer, customers = [], thread, onReply, onLink, configured, siteUrl }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [linkId, setLinkId] = useState('');
  const endRef = useRef(null);
  const messages = thread.psid === conv.psid ? thread.messages : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, conv.psid]);

  useEffect(() => {
    setText('');
    setLinkId('');
  }, [conv.psid]);

  // Khách gõ SĐT trùng với tài khoản web: gợi ý gắn
  const suggestions = useMemo(() => {
    if (customer) return [];
    const phones = new Set(messages.filter((m) => m.direction === 'in').flatMap((m) => phonesInText(m.text)));
    if (!phones.size) return [];
    return customers.filter((c) => c.hasAccount && phones.has(normalizeVnPhone(c.phone)));
  }, [customer, messages, customers]);

  const accounts = useMemo(
    () => customers.filter((c) => c.hasAccount).sort((a, b) => String(a.name).localeCompare(String(b.name), 'vi')),
    [customers]
  );

  const outsideWindow = conv.lastInboundAt && Date.now() - Date.parse(conv.lastInboundAt) > DAY_MS;

  const handleSend = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await onReply(conv.psid, body);
      setText('');
    } catch (err) {
      toast.error(err.message, { duration: 6000 });
    } finally {
      setSending(false);
    }
  };

  const handleLink = async (customerId) => {
    try {
      await onLink(conv.psid, customerId || null);
      toast.success(customerId ? 'Đã gắn với tài khoản web của khách.' : 'Đã bỏ gắn tài khoản.');
      setLinkId('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const insertBookingLink = () => {
    const url = `${(siteUrl || DEFAULT_SITE_URL).replace(/\/+$/, '')}/booking`;
    setText((t) => (t.trim() ? `${t.trimEnd()} ${url}` : url));
  };

  const name = customer?.name || conv.nickname || 'Khách Messenger';

  return (
    <>
      <div className="px-5 py-3.5 border-b border-gray-100 space-y-2">
        <div className="flex items-center gap-3">
          <Avatar name={name} src={conv.profilePic} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-gray-800 truncate" data-testid="inbox-conv-name">{name}</p>
              <ChannelTag channel="messenger" />
              {customer && <ProfileLink customerId={customer.id} />}
            </div>
            <p className="text-xs text-gray-400">
              {customer ? (
                <>
                  {customer.phone || 'Chưa có SĐT'}
                  {customer.petNames?.length ? ` · Mèo: ${customer.petNames.join(', ')}` : ' · Chưa có hồ sơ mèo'}
                  {conv.nickname && conv.nickname !== customer.name ? ` · Facebook: ${conv.nickname}` : ''}
                </>
              ) : 'Chưa gắn tài khoản web'}
            </p>
          </div>
          {customer && (
            <button onClick={() => handleLink(null)} title="Bỏ gắn tài khoản web" className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer">
              <Unlink className="h-4 w-4" />
            </button>
          )}
        </div>

        {!customer && (
          <div className="flex flex-wrap items-center gap-2">
            {suggestions.map((c) => (
              <button key={c.id} onClick={() => handleLink(c.id)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold cursor-pointer">
                <Link2 className="h-3 w-3" /> Gắn với {c.name} ({c.phone})
              </button>
            ))}
            <select value={linkId} onChange={(e) => setLinkId(e.target.value)} data-testid="inbox-link-select"
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white max-w-[240px] focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="">Gắn với tài khoản web…</option>
              {accounts.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>)}
            </select>
            <button onClick={() => handleLink(linkId)} disabled={!linkId}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-[11px] font-bold cursor-pointer">
              Gắn
            </button>
            <span className="text-[11px] text-gray-400">Khách bấm link web bạn gửi khi đã đăng nhập thì tự gắn.</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 bg-gray-50/30">
        {thread.loading && !messages.length && <p className="text-center text-sm text-gray-400 py-10">Đang tải tin nhắn…</p>}
        {!thread.loading && !messages.length && <p className="text-center text-sm text-gray-400 py-10">Chưa có tin nhắn.</p>}
        {messages.map((m) => {
          const mine = m.direction === 'out';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${mine ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'}`}>
                {m.text && <p>{withLinks(m.text)}</p>}
                {(m.attachments || []).map((a, i) => <Attachment key={i} a={a} />)}
                <p className={`text-[10px] mt-1 ${mine ? 'text-blue-100' : 'text-gray-400'}`}>
                  {fmtTime(m.createdAt)}
                  {mine && ` · ${m.sentBy === 'fanpage' || !m.sentBy ? 'Fanpage' : m.sentBy}`}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="px-5 py-3 border-t border-gray-100 space-y-2">
        {outsideWindow && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
            Khách nhắn lần cuối đã quá 24 giờ: Messenger chỉ cho Fanpage trả lời trong 24 giờ, chờ khách nhắn lại.
          </p>
        )}
        <div className="flex gap-3 items-end">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={2000} data-testid="messenger-body"
            placeholder={configured ? `Trả lời ${name} qua Messenger… (Enter để gửi)` : 'Chưa kết nối Fanpage nên chưa gửi được'}
            disabled={!configured}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
          <button onClick={handleSend} disabled={!text.trim() || sending || !configured} title="Gửi qua Messenger"
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition-colors cursor-pointer shrink-0">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={insertBookingLink} disabled={!configured}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-[11px] font-bold text-gray-600 cursor-pointer disabled:opacity-50">
            <Link2 className="h-3 w-3" /> Chèn link đặt phòng
          </button>
          <span className="text-[11px] text-gray-400">Link web trong tin được tự gắn mã: khách bấm vào rồi đặt phòng thì đơn tính là “Đặt qua Messenger”.</span>
        </div>
      </div>
    </>
  );
};

export default MessengerThread;
