import React, { useState } from 'react';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';

const PLATFORM_COLORS = {
  zalo:      { bg: 'bg-sky-100',    text: 'text-sky-700',    label: 'Zalo' },
  messenger: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Messenger' },
};

const Tab5Inbox = ({ conversations }) => {
  const [selected, setSelected] = useState(conversations[0]?.id || null);
  const [reply, setReply] = useState('');

  const conv = conversations.find(c => c.id === selected);

  const handleSend = () => {
    if (!reply.trim()) return;
    alert('CHẾ ĐỘ MÔ PHỎNG: Tin nhắn "' + reply + '" sẽ được gửi qua ' + (conv?.platform || '') + ' khi đã kết nối API thật.');
    setReply('');
  };

  return (
    <div className="space-y-4">
      {/* CẢNH BÁO: Chưa kết nối API */}
      <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 font-medium">
          ⚠️ Hộp thư tập trung chưa kết nối API Zalo OA / Messenger thật. Giao diện dưới đây sử dụng dữ liệu mẫu. Khi kết nối xong, lịch sử hội thoại và tính năng trả lời sẽ hoạt động đầy đủ.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex h-[600px]">
        {/* Danh sách hội thoại */}
        <div className="w-64 shrink-0 border-r border-gray-100 flex flex-col">
          <div className="px-4 py-3.5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">Hội thoại</h3>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {conversations.map(c => {
              const pc = PLATFORM_COLORS[c.platform] || PLATFORM_COLORS.zalo;
              const isActive = c.id === selected;
              return (
                <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-full ${pc.bg} ${pc.text} flex items-center justify-center text-xs font-black shrink-0`}>
                      {c.customer.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className={`text-xs font-bold truncate ${isActive ? 'text-emerald-700' : 'text-gray-800'}`}>{c.customer}</p>
                        {c.unread > 0 && <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">{c.unread}</span>}
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pc.bg} ${pc.text}`}>{pc.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{c.lastAt}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate pl-10">{c.lastMessage}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Khung hội thoại */}
        <div className="flex-1 flex flex-col min-w-0">
          {conv ? (
            <>
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${PLATFORM_COLORS[conv.platform]?.bg || 'bg-gray-100'} flex items-center justify-center font-black text-sm ${PLATFORM_COLORS[conv.platform]?.text || 'text-gray-600'}`}>
                  {conv.customer.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{conv.customer}</p>
                  <p className="text-xs text-gray-400">Mèo: {conv.catName} · {PLATFORM_COLORS[conv.platform]?.label}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/30">
                {conv.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'bot' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === 'bot' ? 'bg-emerald-500 text-white rounded-br-md' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md shadow-xs'}`}>
                      {msg.text}
                      <span className={`block text-[10px] mt-1 ${msg.from === 'bot' ? 'text-emerald-100' : 'text-gray-400'}`}>{msg.at}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex gap-3 items-end">
                <textarea value={reply} onChange={e => setReply(e.target.value)} rows={2} placeholder="Nhập tin nhắn trả lời... (chế độ mô phỏng)" className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
                <button onClick={handleSend} className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors cursor-pointer shrink-0">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Chọn một hội thoại để xem.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tab5Inbox;
