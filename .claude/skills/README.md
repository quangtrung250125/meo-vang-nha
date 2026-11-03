# Marketing skills

18 skill marketing lấy từ [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT, xem `LICENSE-marketingskills`), commit `e85f3cb`. Đã bỏ thư mục `evals/` của từng skill.

Claude Code tự nạp các skill trong thư mục này và tự chọn skill khi yêu cầu khớp với mô tả, hoặc gọi đích danh (ví dụ "dùng skill copywriting").

Nên chạy `product-marketing` trước tiên: nó tạo `.agents/product-marketing.md` mô tả Mèo Vàng Nhà, khách hàng và giọng thương hiệu. Các skill khác đọc file đó trước khi làm.

- Nội dung: product-marketing, copywriting, copy-editing, emails, social, sms
- Quảng cáo và đo lường: ads, ad-creative, analytics, conversion-tracking, ab-testing
- Tăng trưởng: referrals, offers, pricing, launch, marketing-ideas
- SEO: seo-audit, schema

Cập nhật: `npx skills add coreyhaines31/marketingskills --skill <tên skill>`
