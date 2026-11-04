import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import useCustomerData from '../AdminCustomers/useCustomerData';
import { invoiceTotalOf } from '../AdminCustomers/customerUtils';
import {
  fetchMarketingSettings,
  saveMarketingSettings,
  fetchMarketingMessages,
  fetchMarketingAudience,
  sendMarketingMessages,
  describeSendResults,
} from '../../services/marketingApi';
import {
  evaluateScenarios,
  fromAdminCustomer,
  normalizeScenario,
  normalizeTemplate,
  pushIdsOf,
  summarizeResults,
} from '../../utils/marketingEngine';
import {
  MKT_STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
  initialScenarios,
  initialTemplates,
  initialFrequency,
} from './marketingStore';

const REFRESH_MS = 30000;
const AUTO_RUN_MS = 2 * 60 * 1000;

const localConfig = () => ({
  scenarios: loadFromStorage(MKT_STORAGE_KEYS.SCENARIOS, initialScenarios).map(normalizeScenario),
  templates: loadFromStorage(MKT_STORAGE_KEYS.TEMPLATES, initialTemplates).map(normalizeTemplate),
  frequency: { ...initialFrequency, ...loadFromStorage(MKT_STORAGE_KEYS.FREQUENCY, initialFrequency) },
});

/**
 * Dữ liệu thật cho trang Marketing tự động: cài đặt lưu trên server, nhật ký tin đã gửi,
 * khách đã bật thông báo và danh sách khách đến hạn nhận tin theo từng kịch bản.
 */
export default function useMarketingData() {
  const [accounts, setAccounts] = useState([]);
  const { customers: adminCustomers = [], refresh: refreshCustomers } = useCustomerData({ extraProfiles: accounts });
  const [config, setConfig] = useState(localConfig);
  const [messages, setMessages] = useState([]);
  const [devices, setDevices] = useState({});
  const [drafts, setDrafts] = useState({});
  const [status, setStatus] = useState({ loaded: false, pushConfigured: null, database: null, error: null });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [now, setNow] = useState(() => Date.now());
  const autoBusy = useRef(false);

  const refresh = useCallback(async () => {
    setNow(Date.now());
    const [msgRes, audRes] = await Promise.allSettled([fetchMarketingMessages(), fetchMarketingAudience()]);
    if (msgRes.status === 'fulfilled') setMessages(msgRes.value.messages || []);
    if (audRes.status === 'fulfilled') {
      setDevices(audRes.value.devices || {});
      setDrafts(audRes.value.drafts || {});
      const nextAccounts = audRes.value.accounts || [];
      setAccounts((prev) => (JSON.stringify(prev) === JSON.stringify(nextAccounts) ? prev : nextAccounts));
      setStatus((s) => ({
        ...s,
        pushConfigured: audRes.value.pushConfigured,
        serviceRole: audRes.value.serviceRole,
        vapid: audRes.value.vapid || null,
        subscriptionStore: audRes.value.subscriptionStore || null,
      }));
    }
    setLastUpdated(new Date());
  }, []);

  // Lần đầu: lấy cài đặt từ server; server chưa có thì đưa cài đặt đang lưu ở trình duyệt này lên
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchMarketingSettings();
        if (cancelled) return;
        if (res.config?.scenarios?.length) {
          setConfig({
            scenarios: res.config.scenarios.map(normalizeScenario),
            templates: (res.config.templates || []).map(normalizeTemplate),
            frequency: { ...initialFrequency, ...res.config.frequency },
          });
        } else {
          await saveMarketingSettings(localConfig()).catch(() => {});
        }
        setStatus({ loaded: true, pushConfigured: res.pushConfigured, database: res.database, error: null });
      } catch (err) {
        if (!cancelled) setStatus((s) => ({ ...s, loaded: true, error: err.message }));
      }
      if (!cancelled) refresh();
    })();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [refresh]);

  const saveConfig = useCallback(async (patch) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveToStorage(MKT_STORAGE_KEYS.SCENARIOS, next.scenarios);
    saveToStorage(MKT_STORAGE_KEYS.TEMPLATES, next.templates);
    saveToStorage(MKT_STORAGE_KEYS.FREQUENCY, next.frequency);
    try {
      const res = await saveMarketingSettings(next);
      setStatus((s) => ({ ...s, database: res.database }));
      return true;
    } catch (err) {
      toast.error(`Chưa lưu được lên máy chủ: ${err.message}`);
      return false;
    }
  }, [config]);

  const customers = useMemo(() => adminCustomers.map(fromAdminCustomer), [adminCustomers]);
  const pushIdSet = useMemo(() => new Set(Object.keys(devices)), [devices]);
  const deviceCountOf = useCallback(
    (customer) => pushIdsOf(customer).reduce((sum, id) => sum + (devices[id] || 0), 0),
    [devices]
  );

  // Kịch bản có chọn kênh Web Push mới gửi thật
  const webpushScenarios = useMemo(
    () => config.scenarios.filter((s) => (s.channels || []).includes('webpush')),
    [config.scenarios]
  );

  const evaluation = useMemo(() => evaluateScenarios({
    customers,
    scenarios: webpushScenarios,
    templates: config.templates,
    frequency: config.frequency,
    messages,
    drafts,
    now,
    pushIds: pushIdSet,
  }), [customers, webpushScenarios, config.templates, config.frequency, messages, drafts, now, pushIdSet]);

  const resultsFor = useCallback((days) => summarizeResults({
    messages,
    customers,
    scenarios: config.scenarios,
    days,
    now,
    revenueOf: (b) => invoiceTotalOf(b) || Number(b.totalAmount) || 0,
  }), [messages, customers, config.scenarios, now]);

  const send = useCallback(async (list, source = 'manual', { quiet = false } = {}) => {
    if (!list.length) return [];
    try {
      const res = await sendMarketingMessages(list, source);
      const results = res.results || [];
      if (!quiet || results.some((r) => r.status === 'sent')) {
        const sentCount = results.filter((r) => r.status === 'sent').length;
        const text = `${source === 'auto' ? 'Gửi tự động: ' : ''}${describeSendResults(results)}`;
        if (sentCount > 0) toast.success(text, { duration: 5000 });
        else toast(text, { icon: 'ℹ️', duration: 5000 });
      }
      await refresh();
      return results;
    } catch (err) {
      if (!quiet) toast.error(err.message);
      return [];
    }
  }, [refresh]);

  // Khi trang đang mở: tự gửi các tin đã đến hạn cho khách đã bật thông báo
  const dueRef = useRef([]);
  dueRef.current = evaluation.due.filter((d) => d.hasDevice);
  useEffect(() => {
    if (!status.loaded || status.pushConfigured === false) return undefined;
    const tick = async () => {
      if (autoBusy.current || dueRef.current.length === 0) return;
      autoBusy.current = true;
      try {
        await send(dueRef.current, 'auto', { quiet: true });
      } finally {
        autoBusy.current = false;
      }
    };
    const first = setTimeout(tick, 3000);
    const timer = setInterval(() => { setNow(Date.now()); tick(); }, AUTO_RUN_MS);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [status.loaded, status.pushConfigured, send]);

  return {
    ...config,
    saveConfig,
    customers,
    adminCustomers,
    messages,
    devices,
    deviceCountOf,
    evaluation,
    resultsFor,
    send,
    status,
    lastUpdated,
    refresh: async () => { await Promise.all([refresh(), refreshCustomers?.()]); },
  };
}
