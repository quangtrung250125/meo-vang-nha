import React, { useState } from "react";
import {
  User,
  Shield,
  Webhook,
  MessageCircle,
  Mail,
  CreditCard,
  ClipboardList,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Key,
  Globe,
  Bell,
  Lock,
  ChevronRight,
  Settings,
} from "lucide-react";

const TABS = [
  { id: "account", label: "Tai khoan", icon: User },
  { id: "roles", label: "Phan quyen", icon: Shield },
  { id: "api", label: "API/Webhook", icon: Webhook },
  { id: "zalo", label: "Zalo OA", icon: MessageCircle },
  { id: "email", label: "Email", icon: Mail },
  { id: "payment", label: "Cong thanh toan", icon: CreditCard },
  { id: "logs", label: "Nhat ky hoat dong", icon: ClipboardList },
];

const ToggleSwitch = ({ enabled, onToggle, label }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button onClick={onToggle} className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
      style={{ backgroundColor: enabled ? "#f97316" : "#e5e7eb" }}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </div>
);

const SettingSection = ({ title, description, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
      <h3 className="font-bold text-gray-800">{title}</h3>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const InputField = ({ label, type = "text", placeholder, defaultValue, hint }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={isPassword && !show ? "password" : "text"}
          placeholder={placeholder}
          defaultValue={defaultValue}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent pr-10"
        />
        {isPassword && (
          <button onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
};

const AccountTab = () => {
  const [toggles, setToggles] = useState({ twoFactor: true, loginAlert: true, sessionExpiry: false });
  const toggle = (k) => setToggles(prev => ({ ...prev, [k]: !prev[k] }));
  return (
    <div className="space-y-5">
      <SettingSection title="Thong tin tai khoan" description="Cap nhat thong tin co ban cua tai khoan quan tri vien">
        <InputField label="Ho va ten" placeholder="Nguyen Van A" defaultValue="Meo Vang Nha Admin" />
        <InputField label="So dien thoai" placeholder="09xxxxxxxx" defaultValue="0962606249" />
        <InputField label="Email" type="email" placeholder="admin@meovangnha.com" defaultValue="admin@meovangnha.com" />
        <button className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-orange-200">
          <Save className="h-4 w-4" />Luu thay doi
        </button>
      </SettingSection>
      <SettingSection title="Doi mat khau" description="Dam bao mat khau manh de bao ve tai khoan">
        <InputField label="Mat khau hien tai" type="password" placeholder="••••••••" />
        <InputField label="Mat khau moi" type="password" placeholder="••••••••" hint="Toi thieu 8 ky tu, bao gom chu hoa, so va ky tu dac biet" />
        <InputField label="Xac nhan mat khau moi" type="password" placeholder="••••••••" />
        <button className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-orange-200">
          <Lock className="h-4 w-4" />Cap nhat mat khau
        </button>
      </SettingSection>
      <SettingSection title="Bao mat" description="Cai dat xac thuc va bao mat tai khoan">
        <ToggleSwitch enabled={toggles.twoFactor} onToggle={() => toggle("twoFactor")} label="Xac thuc 2 buoc (2FA)" />
        <ToggleSwitch enabled={toggles.loginAlert} onToggle={() => toggle("loginAlert")} label="Canh bao khi co dang nhap tu thiet bi moi" />
        <ToggleSwitch enabled={toggles.sessionExpiry} onToggle={() => toggle("sessionExpiry")} label="Tu dong dang xuat sau 8 gio khong hoat dong" />
      </SettingSection>
    </div>
  );
};

const rolesData = [
  { id: 1, name: "Nguyen Thi Chi", phone: "0901234567", role: "Admin", permissions: ["Quan ly dat phong", "Nhat ky cham soc", "Danh gia", "Cai dat", "Bao cao"], status: "active" },
  { id: 2, name: "Tran Van Bao", phone: "0912345678", role: "Nhan vien", permissions: ["Quan ly dat phong", "Nhat ky cham soc"], status: "active" },
  { id: 3, name: "Le Thi Mai", phone: "0923456789", role: "Cham soc meo", permissions: ["Nhat ky cham soc"], status: "active" },
  { id: 4, name: "Pham Quang Duc", phone: "0934567890", role: "Xem bao cao", permissions: ["Danh gia", "Bao cao"], status: "inactive" },
];

const RolesTab = () => {
  const [users, setUsers] = useState(rolesData);
  const roleColors = { "Admin": "bg-purple-100 text-purple-700", "Nhan vien": "bg-blue-100 text-blue-700", "Cham soc meo": "bg-emerald-100 text-emerald-700", "Xem bao cao": "bg-amber-100 text-amber-700" };
  return (
    <div className="space-y-5">
      <SettingSection title="Quan ly phan quyen" description="Them, chinh sua va quan ly quyen truy cap cua tung thanh vien">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">{users.length} tai khoan</p>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl transition-colors">
            <Plus className="h-4 w-4" />Them tai khoan
          </button>
        </div>
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.id} className={`rounded-xl border p-4 transition-all ${u.status === "active" ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50/50 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {u.name.split(" ").map(w=>w[0]).slice(-2).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${roleColors[u.role] || "bg-gray-100 text-gray-700"}`}>{u.role}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.status === "active" ? "Hoat dong" : "Vo hieu"}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {u.permissions.map((p) => (
                  <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p}</span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="text-xs text-orange-500 hover:text-orange-700 font-semibold flex items-center gap-1"><Shield className="h-3 w-3" />Sua quyen</button>
                <button className="text-xs text-gray-400 hover:text-rose-500 font-semibold flex items-center gap-1 ml-2"><Trash2 className="h-3 w-3" />Xoa</button>
              </div>
            </div>
          ))}
        </div>
      </SettingSection>
    </div>
  );
};

const ApiTab = () => {
  const [showKey, setShowKey] = useState(false);
  const webhooks = [
    { id: 1, name: "Webhook dat phong moi", url: "https://hooks.example.com/booking", event: "booking.created", active: true },
    { id: 2, name: "Webhook thanh toan thanh cong", url: "https://hooks.example.com/payment", event: "payment.success", active: true },
    { id: 3, name: "Webhook danh gia moi", url: "https://hooks.example.com/review", event: "review.created", active: false },
  ];
  return (
    <div className="space-y-5">
      <SettingSection title="API Keys" description="Quan ly khoa API de ket noi voi he thong ben ngoai">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">API Key hien tai</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type={showKey ? "text" : "password"} readOnly defaultValue="mvn_live_sk_8f4b2c91d3e7a056..." className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none font-mono" />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">Tao lai</button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1"><Info className="h-3 w-3" />Khoa API chi hien thi mot lan. Hay luu lai ngay sau khi tao moi.</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Bao mat API Key</p>
            <p className="text-xs text-amber-700 mt-0.5">Khong chia se API key cong khai. Su dung bien moi truong (environment variables) de luu tru an toan.</p>
          </div>
        </div>
      </SettingSection>
      <SettingSection title="Webhooks" description="Cau hinh endpoints de nhan thong bao tu dong ve cac su kien">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">{webhooks.length} webhooks</p>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl transition-colors">
            <Plus className="h-4 w-4" />Them webhook
          </button>
        </div>
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className={`rounded-xl border p-4 ${wh.active ? "border-gray-200" : "border-gray-100 bg-gray-50/50 opacity-60"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-900 text-sm">{wh.name}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${wh.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {wh.active ? "Hoat dong" : "Vo hieu"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono truncate">{wh.url}</p>
                  <p className="text-xs text-blue-600 mt-1">Su kien: {wh.event}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button className="text-xs text-orange-500 hover:text-orange-700 font-semibold">Sua</button>
                  <button className="text-xs text-gray-400 hover:text-rose-500 font-semibold">Xoa</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SettingSection>
    </div>
  );
};

const ZaloTab = () => {
  const [toggles, setToggles] = useState({ bookingConfirm: true, reminders: true, reviews: false, promotions: true });
  const toggle = (k) => setToggles(prev => ({ ...prev, [k]: !prev[k] }));
  return (
    <div className="space-y-5">
      <SettingSection title="Ket noi Zalo Official Account" description="Cau hinh Zalo OA de gui thong bao tu dong den khach hang">
        <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-black text-xl shrink-0">Z</div>
          <div>
            <p className="font-bold text-blue-900">Meo Vang Nha Official</p>
            <p className="text-sm text-blue-600">ID: 1234567890123456</p>
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5"><CheckCircle className="h-3 w-3" />Da ket noi thanh cong</p>
          </div>
          <button className="ml-auto px-3 py-1.5 text-xs font-bold text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors">Huy ket noi</button>
        </div>
        <InputField label="Access Token" type="password" placeholder="Nhap Zalo OA Access Token" defaultValue="zalo_oa_token_xxxx" />
        <InputField label="App ID" placeholder="Nhap Zalo App ID" defaultValue="1234567890123456" />
        <InputField label="Secret Key" type="password" placeholder="Nhap Zalo Secret Key" />
        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm rounded-xl transition-colors">
          <Save className="h-4 w-4" />Luu cau hinh Zalo
        </button>
      </SettingSection>
      <SettingSection title="Thong bao Zalo tu dong" description="Chon loai thong bao se gui qua Zalo den khach hang">
        <ToggleSwitch enabled={toggles.bookingConfirm} onToggle={() => toggle("bookingConfirm")} label="Xac nhan dat phong thanh cong" />
        <ToggleSwitch enabled={toggles.reminders} onToggle={() => toggle("reminders")} label="Nhac nho check-in / check-out" />
        <ToggleSwitch enabled={toggles.reviews} onToggle={() => toggle("reviews")} label="Yeu cau danh gia sau khi tra phong" />
        <ToggleSwitch enabled={toggles.promotions} onToggle={() => toggle("promotions")} label="Gui khuyen mai va tin tuc" />
      </SettingSection>
    </div>
  );
};

const EmailTab = () => {
  const [toggles, setToggles] = useState({ smtpTLS: true, emailConfirm: true, emailReport: false });
  const toggle = (k) => setToggles(prev => ({ ...prev, [k]: !prev[k] }));
  return (
    <div className="space-y-5">
      <SettingSection title="Cau hinh SMTP" description="Cai dat may chu email de gui thong bao">
        <InputField label="SMTP Host" placeholder="smtp.gmail.com" defaultValue="smtp.gmail.com" />
        <InputField label="SMTP Port" placeholder="587" defaultValue="587" />
        <InputField label="Email nguoi gui" placeholder="admin@meovangnha.com" defaultValue="noreply@meovangnha.com" />
        <InputField label="Ten hien thi" placeholder="Meo Vang Nha" defaultValue="Meo Vang Nha" />
        <InputField label="Mat khau App Email" type="password" placeholder="xxxx xxxx xxxx xxxx" />
        <ToggleSwitch enabled={toggles.smtpTLS} onToggle={() => toggle("smtpTLS")} label="Su dung TLS/SSL" />
        <div className="mt-4 flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-orange-200">
            <Save className="h-4 w-4" />Luu cai dat SMTP
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors">
            <Mail className="h-4 w-4" />Gui email thu
          </button>
        </div>
      </SettingSection>
      <SettingSection title="Email tu dong" description="Chon loai email se tu dong gui den khach hang">
        <ToggleSwitch enabled={toggles.emailConfirm} onToggle={() => toggle("emailConfirm")} label="Email xac nhan dat phong" />
        <ToggleSwitch enabled={toggles.emailReport} onToggle={() => toggle("emailReport")} label="Bao cao tong hop hang tuan gui Admin" />
      </SettingSection>
    </div>
  );
};

const PaymentTab = () => {
  const gateways = [
    { id: "vnpay", name: "VNPay", logo: "💳", desc: "Thanh toan qua VNPay - Ho tro the noi dia va quoc te", connected: true },
    { id: "momo", name: "MoMo", logo: "💜", desc: "Vi dien tu MoMo - Pho bien tai Viet Nam", connected: true },
    { id: "zalopay", name: "ZaloPay", logo: "💙", desc: "Vi dien tu ZaloPay - Tich hop voi Zalo OA", connected: false },
    { id: "stripe", name: "Stripe", logo: "⚡", desc: "Thanh toan quoc te - Ho tro the Visa, Mastercard", connected: false },
  ];
  return (
    <div className="space-y-5">
      <SettingSection title="Cong thanh toan" description="Ket noi va quan ly cac phuong thuc thanh toan">
        <div className="space-y-4">
          {gateways.map((gw) => (
            <div key={gw.id} className={`rounded-xl border p-5 flex items-center justify-between gap-4 ${gw.connected ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200"}`}>
              <div className="flex items-center gap-4">
                <span className="text-3xl">{gw.logo}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900">{gw.name}</p>
                    {gw.connected && <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="h-3 w-3" />Da ket noi</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{gw.desc}</p>
                </div>
              </div>
              <button className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors shrink-0 ${gw.connected ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
                {gw.connected ? "Cau hinh" : "Ket noi"}
              </button>
            </div>
          ))}
        </div>
      </SettingSection>
      <SettingSection title="Cai dat thanh toan" description="Thiet lap cac tham so chung cho viec thanh toan">
        <InputField label="Don vi tien te" placeholder="VND" defaultValue="VND" />
        <InputField label="Phi coc dat phong (%)" placeholder="30" defaultValue="30" hint="Phan tram gia tri dat phong yeu cau khi xac nhan" />
        <InputField label="Thoi han thanh toan (gio)" placeholder="24" defaultValue="24" hint="Thoi gian giu cho dat phong truoc khi tu dong huy" />
        <button className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-orange-200">
          <Save className="h-4 w-4" />Luu cai dat
        </button>
      </SettingSection>
    </div>
  );
};

const logsData = [
  { id: 1, time: "14:35:22", date: "24/10/2026", action: "Dang nhap he thong", user: "Admin 0962606249", ip: "113.161.xx.xx", type: "auth", success: true },
  { id: 2, time: "14:20:05", date: "24/10/2026", action: "Tao dat phong moi #BK2026001", user: "Admin 0962606249", ip: "113.161.xx.xx", type: "booking", success: true },
  { id: 3, time: "13:55:10", date: "24/10/2026", action: "Cap nhat nhat ky meo Luna", user: "Nguyen Thi Chi", ip: "1.53.xx.xx", type: "care", success: true },
  { id: 4, time: "13:10:33", date: "24/10/2026", action: "Xuat bao cao thang 10", user: "Admin 0962606249", ip: "113.161.xx.xx", type: "report", success: true },
  { id: 5, time: "12:45:01", date: "24/10/2026", action: "Dang nhap that bai (sai mat khau)", user: "Unknown", ip: "42.112.xx.xx", type: "auth", success: false },
  { id: 6, time: "11:30:55", date: "24/10/2026", action: "Sua phan quyen tai khoan Tran Van Bao", user: "Admin 0962606249", ip: "113.161.xx.xx", type: "settings", success: true },
  { id: 7, time: "10:15:20", date: "24/10/2026", action: "Huy dat phong #BK2026058", user: "Nguyen Thi Chi", ip: "1.53.xx.xx", type: "booking", success: true },
  { id: 8, time: "09:02:44", date: "24/10/2026", action: "Doi mat khau tai khoan", user: "Admin 0962606249", ip: "113.161.xx.xx", type: "auth", success: true },
];

const LogsTab = () => {
  const [filterType, setFilterType] = useState("all");
  const typeColors = {
    auth: "bg-blue-50 text-blue-700 border-blue-200",
    booking: "bg-orange-50 text-orange-700 border-orange-200",
    care: "bg-emerald-50 text-emerald-700 border-emerald-200",
    report: "bg-purple-50 text-purple-700 border-purple-200",
    settings: "bg-gray-100 text-gray-700 border-gray-200",
  };
  const typeLabels = { auth: "Xac thuc", booking: "Dat phong", care: "Cham soc", report: "Bao cao", settings: "Cai dat" };
  const filtered = filterType === "all" ? logsData : logsData.filter(l => l.type === filterType);
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <Clock className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">Loc hoat dong:</span>
        <div className="flex flex-wrap gap-2">
          {["all", "auth", "booking", "care", "report", "settings"].map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filterType === t ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {t === "all" ? "Tat ca" : typeLabels[t]}
            </button>
          ))}
        </div>
        <button className="ml-auto px-4 py-2 text-xs font-bold text-orange-500 border border-orange-200 hover:bg-orange-50 rounded-xl transition-colors">
          Xuat CSV
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Thoi gian</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Hanh dong</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nguoi dung</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Loai</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Ket qua</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-mono font-semibold text-gray-800">{log.time}</p>
                    <p className="text-xs text-gray-400">{log.date}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-800">{log.action}</p>
                    <p className="text-xs text-gray-400 font-mono">{log.ip}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-gray-700">{log.user}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-lg border ${typeColors[log.type] || "bg-gray-100 text-gray-700"}`}>
                      {typeLabels[log.type] || log.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {log.success ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle className="h-3 w-3" />Thanh cong</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full"><AlertCircle className="h-3 w-3" />That bai</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("account");
  const renderTab = () => {
    switch (activeTab) {
      case "account": return <AccountTab />;
      case "roles": return <RolesTab />;
      case "api": return <ApiTab />;
      case "zalo": return <ZaloTab />;
      case "email": return <EmailTab />;
      case "payment": return <PaymentTab />;
      case "logs": return <LogsTab />;
      default: return null;
    }
  };
  return (
    <div className="p-6 min-h-screen bg-gray-50/50">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-1 flex items-center gap-3">
          <Settings className="h-8 w-8 text-orange-500" />Cai dat
        </h1>
        <p className="text-gray-500 text-sm">Cau hinh he thong, phan quyen va tich hop dich vu cua Meo Vang Nha.</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-56 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition-all border-b border-gray-50 last:border-0 ${active ? "bg-orange-50 text-orange-600 border-l-[3px] border-l-orange-500" : "text-gray-600 hover:text-orange-600 hover:bg-orange-50/50"}`}>
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-orange-500" : "text-gray-400"}`} />
                  <span className="truncate">{label}</span>
                  {active && <ChevronRight className="h-3 w-3 ml-auto text-orange-400" />}
                </button>
              );
            })}
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          {renderTab()}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
