# PBI-1: Phát triển Backend Core (Local DB & Logic Engine)

## 1. Mục tiêu (Objective)
Xây dựng lớp dữ liệu trung tâm lưu trữ thông tin trên thiết bị (Offline-first) và các thuật toán tính toán lõi cho ứng dụng Badminton Cost Splitter. *(Do app theo định hướng Local-first MVP, "BE" ở đây được hiểu là Domain/Data Layer & Business Logic chạy ngầm bên dưới)*.

## 2. Phạm vi (Scope)
- Thiết lập hệ cơ sở dữ liệu trên Client (ví dụ: `IndexedDB` nều dùng Web/PWA, hoặc `SQLite` nếu Mobile Native).
- Thiết kế Models và schema.
- Xây dựng Module thuật toán tính toán chia tiền trọng tâm (Greedy Algorithm).

## 3. Yêu cầu chi tiết (Requirements)
- **Data Models:** Khởi tạo cấu trúc bảng logic cho `Player`, `Session` (Bắt buộc chứa trường `note` và cột JSON `cost_items` để lưu chi tiết các khoản: tiền sân, cầu, ...), `SessionPlayer`, `Settlement`. Tất cả ID dùng `UUID` (sinh tại local).
- **Data Access Layer:** Cung cấp API nội bộ với các hàm CRUD.
- **Calculation Engine:**
  1. `calculateEqualSplit`: Hàm chia tiền đều dựa vào tổng chi và danh sách tham gia (có logic làm tròn lên hàng nghìn đồng).
  2. `optimizeDebtSettlement`: Thuật toán Greedy Cash Flow nhận vào mảng số dư ròng của từng người chơi, output ra danh sách lịch trình chuyển khoản cực tiểu.

## 4. Công việc cụ thể (Tasks)
- [ ] **Task 1.1:** Khởi tạo Cấu trúc DB cục bộ (Tables/Collections/Stores).
- [ ] **Task 1.2:** Cài đặt hàm `ID Generator` để tạo UID.
- [ ] **Task 1.3:** Viết module `PlayerRepository` và `SessionRepository` để lưu trữ/đọc dữ liệu.
- [ ] **Task 1.4:** Thiết kế và code thuật toán `optimizeDebtSettlement` (Greedy).
- [ ] **Task 1.5:** Viết các **Unit Test** nghiêm ngặt cho thuật toán chia tiền để đảm bảo luôn ra kết quả chuẩn và tổng bù trừ bằng `0`.

## 5. Tiêu chí nghiệm thu (Definition of Done)
- [ ] Các hàm test (đặc biệt thuật toán cực tiểu hóa giao dịch) chạy pass 100% với biên độ nhiều người cùng nợ / trả (tối thiểu 5 edge cases).
- [ ] Dữ liệu có thể lưu và recall thành công từ Local DB khi tắt mạng.
