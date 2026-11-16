-- ============================================================
-- HỘP THƯ TẬP TRUNG — TIN NHẮN MESSENGER (Fanpage Mèo Vắng Nhà)
-- Lưu các cuộc trò chuyện khách nhắn tới Fanpage (nhận qua webhook /api/marketing/messenger)
-- và tin nhân viên trả lời. Mỗi cuộc trò chuyện có thể gắn với tài khoản khách trên web.
-- Chạy một lần trong Supabase Dashboard > SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.messenger_conversations (
    psid TEXT PRIMARY KEY,                 -- mã khách trên Messenger (Page-scoped ID)
    nickname TEXT,                         -- tên Facebook của khách
    profile_pic TEXT,
    customer_id TEXT,                      -- tài khoản web đã gắn (null: chưa có / chưa gắn)
    linked_by TEXT,                        -- 'link' (khách bấm link) | 'booking' | 'staff'
    linked_at TIMESTAMPTZ,
    ref_token TEXT UNIQUE,                 -- mã gắn vào link web gửi qua Messenger (?src=messenger&mref=...)
    last_text TEXT,
    last_message_at TIMESTAMPTZ,
    last_inbound_at TIMESTAMPTZ,           -- Messenger chỉ cho Fanpage trả lời trong 24 giờ sau tin cuối của khách
    unread INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messenger_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mid TEXT UNIQUE,                       -- mã tin của Facebook, để webhook gửi lại không bị lưu trùng
    psid TEXT NOT NULL,
    direction TEXT NOT NULL,               -- 'in' (khách nhắn) | 'out' (Fanpage trả lời)
    text TEXT,
    attachments JSONB,
    sent_by TEXT,                          -- email nhân viên trả lời từ web, 'fanpage' nếu trả lời trong Meta Business Suite
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messenger_messages_psid ON public.messenger_messages(psid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messenger_conversations_last ON public.messenger_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messenger_conversations_customer ON public.messenger_conversations(customer_id);

-- Chỉ máy chủ (service role) đọc / ghi; trình duyệt đi qua /api/marketing/* đã kiểm tra quyền Admin.
ALTER TABLE public.messenger_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messenger_messages ENABLE ROW LEVEL SECURITY;
