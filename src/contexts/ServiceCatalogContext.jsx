// Danh mục dịch vụ dùng chung: admin sửa ở trang Dịch vụ (admin), khách thấy ngay ở trang Dịch vụ & Đặt phòng.
// Nguồn dữ liệu: bảng Supabase `service_catalog` (xem supabase/migrations/20261102_create_service_catalog.sql),
// gộp với bản mặc định trong src/mockData. Không lưu localStorage để mọi máy luôn thấy cùng một bảng giá.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  mergeCatalog,
  isItemVisible,
  roomSurchargesOf,
  roomTypesOf,
  buildBoardingPackages,
} from '../utils/serviceCatalog';

const TABLE = 'service_catalog';
const REFRESH_MS = 30000;
const QUERY_TIMEOUT_MS = 8000;

const ServiceCatalogContext = createContext(null);

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase không phản hồi')), QUERY_TIMEOUT_MS)),
  ]);

const buildValue = (rows) => {
  const { items, rooms, rules } = mergeCatalog(rows);
  return {
    items,
    publishedItems: items.filter(isItemVisible),
    rooms,
    roomTypes: roomTypesOf(rooms),
    roomSurcharges: roomSurchargesOf(rooms),
    rules,
    activeRules: rules.filter((r) => r.active),
    boardingPackages: buildBoardingPackages(items, rooms),
  };
};

export const ServiceCatalogProvider = ({ children }) => {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '', tableMissing: false });
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    try {
      const { data, error } = await withTimeout(supabase.from(TABLE).select('*'));
      if (!mounted.current) return;
      if (error) {
        const missing = error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message || '');
        setStatus({ loading: false, error: error.message || 'Lỗi tải danh mục', tableMissing: missing });
        return;
      }
      setRows(Array.isArray(data) ? data : []);
      setStatus({ loading: false, error: '', tableMissing: false });
    } catch (err) {
      if (mounted.current) setStatus((s) => ({ ...s, loading: false, error: err.message || 'Lỗi tải danh mục' }));
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    reload();

    // Realtime: admin lưu là mọi trang khách đang mở nhận bản mới ngay
    let channel = null;
    try {
      channel = supabase
        .channel('mvn_service_catalog_rt')
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => reload())
        .subscribe();
    } catch {
      channel = null;
    }

    // Dự phòng khi Realtime chưa bật: tải lại khi quay lại tab và định kỳ
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const timer = setInterval(reload, REFRESH_MS);

    return () => {
      mounted.current = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [reload]);

  // Ghi 1 dòng lên Supabase rồi cập nhật ngay trên máy admin
  const saveRow = useCallback(async ({ id, kind, data, isPublished, sortOrder }) => {
    const existing = rows.find((r) => r.id === id);
    const { data: sessionData } = await supabase.auth.getSession();
    const row = {
      id,
      kind,
      data: data ?? existing?.data ?? {},
      is_published: typeof isPublished === 'boolean' ? isPublished : existing?.is_published ?? true,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : existing?.sort_order ?? null,
      updated_at: new Date().toISOString(),
      updated_by: sessionData?.session?.user?.email || null,
    };
    const { data: saved, error } = await withTimeout(supabase.from(TABLE).upsert(row).select());
    if (error) {
      const missing = error.code === '42P01' || error.code === 'PGRST205' || /does not exist|could not find the table/i.test(error.message || '');
      if (missing) throw new Error('Chưa tạo bảng service_catalog trên Supabase. Hãy chạy file supabase/migrations/20261102_create_service_catalog.sql.');
      if (error.code === '42501' || /row-level security|permission/i.test(error.message || '')) {
        throw new Error('Tài khoản này chưa có quyền sửa danh mục trên Supabase (xem bảng service_catalog_admins).');
      }
      throw new Error(error.message || 'Không lưu được');
    }
    if (!Array.isArray(saved) || saved.length === 0) {
      throw new Error('Supabase không ghi được dòng này (có thể tài khoản chưa có quyền admin).');
    }
    setRows((prev) => [...prev.filter((r) => r.id !== id), saved[0]]);
    return saved[0];
  }, [rows]);

  const deleteRow = useCallback(async (id) => {
    const { error } = await withTimeout(supabase.from(TABLE).delete().eq('id', id));
    if (error) throw new Error(error.message || 'Không xoá được');
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const rowFor = useCallback((id) => rows.find((r) => r.id === id), [rows]);

  const value = useMemo(() => {
    const merged = buildValue(rows);

    // Lưu thông tin dịch vụ. `changes` chỉ gồm các trường admin sửa; giữ nguyên trường đã sửa trước đó.
    const saveItem = (id, changes, options = {}) =>
      saveRow({ id, kind: 'item', data: { ...(rowFor(id)?.data || {}), ...changes }, isPublished: options.published, sortOrder: options.sortOrder });

    const addItem = (item) => {
      const id = `svc-${Date.now().toString(36)}`;
      const maxOrder = Math.max(0, ...merged.items.map((i) => i.sortOrder ?? 0));
      return saveRow({ id, kind: 'item', data: { ...item }, isPublished: item.published !== false, sortOrder: maxOrder + 1 });
    };

    const setItemPublished = (id, published) =>
      saveRow({ id, kind: 'item', data: rowFor(id)?.data || {}, isPublished: published });

    // Quay về bản mặc định trong code (chỉ áp dụng cho dịch vụ có sẵn)
    const resetItem = (id) => deleteRow(id);

    const saveRoom = (key, changes) =>
      saveRow({ id: key, kind: 'room', data: { ...(rowFor(key)?.data || {}), ...changes } });

    const saveRule = (rule) => {
      const id = rule.id || `rule-${Date.now().toString(36)}`;
      const { id: _ignored, isCustom: _c, edited: _e, updatedAt: _u, published: _p, sortOrder: _s, ...data } = rule;
      return saveRow({ id, kind: 'rule', data });
    };

    // Quy tắc admin tự thêm thì xoá được; quy tắc mẫu chỉ tắt đi
    const removeRule = (rule) =>
      rule.isCustom ? deleteRow(rule.id) : saveRow({ id: rule.id, kind: 'rule', data: { ...(rowFor(rule.id)?.data || {}), active: false } });

    return {
      ...merged,
      ...status,
      reload,
      saveItem,
      addItem,
      setItemPublished,
      resetItem,
      saveRoom,
      saveRule,
      removeRule,
    };
  }, [rows, status, reload, saveRow, deleteRow, rowFor]);

  return <ServiceCatalogContext.Provider value={value}>{children}</ServiceCatalogContext.Provider>;
};

// Không có Provider (vd. trong test) thì dùng bản mặc định, không lỗi
const FALLBACK = { ...buildValue([]), loading: false, error: '', tableMissing: false };

export const useServiceCatalog = () => useContext(ServiceCatalogContext) || FALLBACK;
