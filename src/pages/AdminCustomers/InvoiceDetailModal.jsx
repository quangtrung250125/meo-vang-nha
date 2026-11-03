import React from 'react';
import { X, FileDown, Receipt, History } from 'lucide-react';
import { checkOutTimingLabel } from '../../utils/bookingInvoice';
import { bookingStage, formatMoney, formatDate, formatMonth, invoiceOf, isRevenueBooking, paymentStateOf, revenueMonthOf } from './customerUtils';
import { PaymentBadge, StageBadge } from './shared';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const formatDateTime = (value) => {
  const t = value ? new Date(value) : null;
  return t && !Number.isNaN(t.getTime()) ? t.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
};

// Mở hóa đơn ở cửa sổ mới để in hoặc lưu thành PDF
export function exportInvoice(customer, booking, invoice) {
  const rows = invoice.lines.map((l) => `
    <tr>
      <td>${escapeHtml(l.label)}${l.detail ? `<div class="muted">${escapeHtml(l.detail)}</div>` : ''}</td>
      <td class="num">${escapeHtml(formatMoney(l.amount))}</td>
    </tr>`).join('');
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<title>Hóa đơn ${escapeHtml(invoice.code)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;margin:32px;font-size:14px}
  h1{font-size:22px;margin:0 0 4px} .muted{color:#6b7280;font-size:12px;margin-top:2px}
  .head{display:flex;justify-content:space-between;border-bottom:2px solid #f97316;padding-bottom:12px;margin-bottom:16px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;margin-top:8px} th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}
  th{background:#f9fafb;font-size:12px;text-transform:uppercase;color:#6b7280} .num{text-align:right;white-space:nowrap}
  .total td{font-weight:bold;font-size:16px;border-top:2px solid #111827}
</style></head><body>
<div class="head">
  <div><h1>Mèo Vắng Nhà</h1><div class="muted">Khách sạn & spa cho mèo · meovangnha.store</div></div>
  <div style="text-align:right"><strong>HÓA ĐƠN ${escapeHtml(invoice.code)}</strong><div class="muted">Xuất lúc ${escapeHtml(formatDateTime(new Date()))}</div></div>
</div>
<div class="grid">
  <div>Khách hàng: <strong>${escapeHtml(customer?.fullName || booking.customerName || '')}</strong></div>
  <div>Số điện thoại: ${escapeHtml(customer?.phone || booking.customerPhone || '')}</div>
  <div>Phòng: ${escapeHtml(booking.roomId || booking.selectedRoom?.name || '')}</div>
  <div>Mèo: ${escapeHtml(booking.catNames || `${booking.cats || 1} bé`)}</div>
  <div>Gửi mèo: ${escapeHtml(formatDate(invoice.checkIn))}</div>
  <div>Đón mèo: ${escapeHtml(formatDate(invoice.checkOut))} (${invoice.nights} đêm)</div>
  ${checkOutTimingLabel(invoice) ? `<div><strong>Ghi chú: ${escapeHtml(checkOutTimingLabel(invoice))}</strong> (hẹn đón ${escapeHtml(formatDate(invoice.plannedCheckOut))})</div>` : ''}
</div>
<table>
  <thead><tr><th>Nội dung</th><th class="num">Thành tiền</th></tr></thead>
  <tbody>${rows}
    <tr class="total"><td>Tổng cộng</td><td class="num">${escapeHtml(formatMoney(invoice.total))}</td></tr>
    <tr><td>Đã nhận</td><td class="num">${escapeHtml(formatMoney(invoice.received))}</td></tr>
    <tr><td><strong>Còn phải thu</strong></td><td class="num"><strong>${escapeHtml(formatMoney(invoice.outstanding))}</strong></td></tr>
  </tbody>
</table>
<p class="muted">Doanh thu của hóa đơn được ghi nhận cho ${escapeHtml(formatMonth(revenueMonthOf(booking)).toLowerCase())} khi khách đã thanh toán đủ và đã check-out.</p>
<script>window.onload = function () { window.print(); };</script>
</body></html>`;
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

// Hóa đơn của một đơn trong hồ sơ khách: tự cập nhật theo yêu cầu khách gửi từ giao diện khách hàng
const InvoiceDetailModal = ({ customer, booking, onClose }) => {
  if (!booking) return null;
  const invoice = invoiceOf(booking);
  const recognized = isRevenueBooking(booking);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Hóa đơn ${invoice.code}`}
      >
        <div className="flex items-start justify-between gap-3 p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-900 inline-flex items-center gap-2">
              <Receipt className="h-5 w-5 text-orange-500" /> Hóa đơn {invoice.code}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {customer?.fullName} · {formatDate(invoice.checkIn)} → {formatDate(invoice.checkOut)} ({invoice.nights} đêm)
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <PaymentBadge state={paymentStateOf(booking)} />
              <StageBadge stage={bookingStage(booking)} />
              {checkOutTimingLabel(invoice) && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  invoice.checkOutTiming === 'early' ? 'bg-sky-100 text-sky-700' : invoice.checkOutTiming === 'late' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  📝 {checkOutTimingLabel(invoice)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportInvoice(customer, booking, invoice)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
            >
              <FileDown className="h-4 w-4" /> Xuất hóa đơn
            </button>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100" aria-label="Đóng">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50/60">
                <th className="px-3 py-2">Nội dung</th>
                <th className="px-3 py-2 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoice.lines.map((l) => (
                <tr key={l.key}>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-gray-800">{l.label}</p>
                    {l.detail && <p className={`text-xs mt-0.5 ${l.pending ? 'text-amber-600' : 'text-gray-400'}`}>{l.detail}</p>}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-bold whitespace-nowrap ${l.amount < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                    {l.kind !== 'base' && l.amount > 0 ? '+' : ''}{formatMoney(l.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td className="px-3 py-2.5 font-black text-gray-900">Tổng hóa đơn</td>
                <td className="px-3 py-2.5 text-right font-black text-gray-900">{formatMoney(invoice.total)}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 text-gray-500">Đã nhận{invoice.depositPaid ? ' (tiền cọc)' : ''}</td>
                <td className="px-3 py-1.5 text-right text-gray-700">{formatMoney(invoice.received)}</td>
              </tr>
              <tr>
                <td className="px-3 py-1.5 font-bold text-gray-700">Còn phải thu</td>
                <td className={`px-3 py-1.5 text-right font-bold ${invoice.outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatMoney(invoice.outstanding)}</td>
              </tr>
            </tfoot>
          </table>

          <div className={`rounded-xl px-4 py-3 text-xs font-semibold ${recognized ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'}`}>
            {recognized
              ? `Đã ghi nhận ${formatMoney(invoice.total)} vào doanh thu ${formatMonth(revenueMonthOf(booking)).toLowerCase()}.`
              : `Chưa ghi nhận doanh thu. Khi khách đã thanh toán đủ và đã check-out, ${formatMoney(invoice.total)} sẽ được cộng vào ${formatMonth(revenueMonthOf(booking)).toLowerCase()}.`}
          </div>

          <div>
            <p className="text-sm font-bold text-gray-800 inline-flex items-center gap-2 mb-2">
              <History className="h-4 w-4 text-orange-500" /> Thay đổi, yêu cầu từ khách
            </p>
            {invoice.changes.length === 0 ? (
              <p className="text-xs text-gray-500">Khách chưa thay đổi hay yêu cầu thêm gì.</p>
            ) : (
              <ul className="space-y-1.5">
                {invoice.changes.map((c, i) => (
                  <li key={i} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-gray-400 whitespace-nowrap">{formatDateTime(c.at) || '—'}</span>
                    <span>{c.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailModal;
