# Quy trình làm việc với Git & Đồng bộ mã nguồn

Khi phát triển và chỉnh sửa mã nguồn trong dự án này, luôn tuân thủ nghiêm ngặt các quy tắc sau:

1. **Đồng bộ trước khi đẩy code (Pull trước khi Push)**:
   - Trước khi bắt đầu đẩy bất kỳ code mới nào lên GitHub, bắt buộc phải chạy lệnh:
     ```bash
     git pull origin <branch_hien_tai>
     ```
   - Cập nhật các thay đổi mới nhất từ các tài khoản khác trên kho lưu trữ chung.

2. **Xử lý xung đột mã nguồn (Merge Conflict)**:
   - Nếu phát sinh xung đột code (Git Merge Conflict), hệ thống tự động ưu tiên merge an toàn theo hướng bảo toàn tính năng của cả hai phía để tránh làm mất code của người khác và code mới.
   - Không được dùng cờ ép buộc (`--force` hoặc checkout đè làm mất code người khác).

3. **Tự động Commit & Push sau khi hoàn thiện**:
   - Sau khi hoàn thiện tính năng hoặc sửa lỗi, thực hiện:
     ```bash
     git add <cac_file_thay_doi>
     git commit -m "<noi_dung_commit_ro_rang>"
     git push origin <branch_hien_tai>
     ```
   - Thực hiện tự động đẩy lên nhánh làm việc hiện tại mà không cần phải hỏi lại người dùng.
