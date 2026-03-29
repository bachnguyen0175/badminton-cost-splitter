# 📄 Product Requirements Document (PRD) - 🏸 Badminton Cost Splitter

## 🎯 1. Overview
**Mục tiêu:** Xây dựng một ứng dụng giúp:
- Ghi lại buổi chơi cầu lông một cách nhanh chóng.
- Chia tiền đơn giản, minh bạch và tức thời.
- Tự động tính toán ai nợ ai, tối ưu hóa dòng tiền.

**Target users:** Nhóm bạn chơi cầu lông định kỳ (3–8 người), không muốn tính toán thủ công nhức đầu, thường giao dịch qua Zalo/Chuyển khoản.
**Product positioning:** Phiên bản "tối giản & chớp nhoáng" hơn Splitwise. Tối ưu hoàn toàn cho session-based usage (Dùng 1 lần -> Nhận kết quả -> Xong).

## 🧩 2. Core Features (MVP)
### 2.1 Create Session
- **User flow:** Mở app -> Nhấn “New Session” -> Chọn người chơi từ danh sách.
- **Requirement:** Có danh sách người chơi đã lưu (Local DB). Quá trình thêm người mới phải "siêu tốc" (chỉ cần nhập tên).

### 2.2 Input Cost
- **Input:** Tổng tiền (Required). Phải hỗ trợ bàn phím số to rõ.
- **Optional:** Ghi chú (VD: "Sân + Cầu", "Sân + Cầu + Nước").

### 2.3 Who Paid (Ai ứng tiền)
- **Requirement:** Cho phép chọn 1 hoặc nhiều người đã ứng tiền.
- **Input:** Nhập số tiền mỗi người đã thanh toán. (Ví dụ: Tổng 200k, Bách đi trễ Nam trả thay 200k, hoặc chia nhau trả mỗi người 100k).

### 2.4 Split Logic (Core - Chia tiền)
- **Rule:** Mặc định chia đều cho tất cả người tham gia (Equal Split).
- **Công thức:** `each = total_cost / number_of_players`.
- *Lưu ý làm tròn tiền:* Làm tròn lên số chẵn (bội số của 1.000 VNĐ) để giải quyết số lẻ (Ví dụ 66.666đ -> 67.000đ).

### 2.5 Debt Settlement (Tính toán bù trừ cực tiểu - Core nhất)
- **Output:** Danh sách chính xác ai cần chuyển khoản cho ai bao nhiêu tiền, cực tiểu hoá số lần chuyển.
- **Requirement:** 
  - Tối ưu số giao dịch (Minimal transfers). Sử dụng thuật toán **Greedy Cash Flow Minimization**.
  - Không dư/thiếu tiền tổng.
- **Ví dụ Output:** `Nam chuyển Bách 50k`, `Huy chuyển Bách 50k`.

### 2.6 Result Screen & Export
- **Hiển thị:** Bảng tóm tắt kết quả (Ai trả bao nhiêu, cuối cùng lòi ra ai nợ ai).
- **Action:** Copy to Clipboard, Nút Share (mở Native Share sang Zalo/Messenger).

### 2.7 Session History
- **Requirement:** Lưu toàn bộ session xuống máy (Offline-first). Có thể xem lại lịch sử (Ngày chơi, tổng tiền, người tham gia, kết quả).

## 📱 3. UX Requirements (RẤT QUAN TRỌNG)
- **Goal:** Dưới 10 giây để ra kết quả.
- **Single-screen design:** Tất cả trên 1 luồng: Chọn người -> Nhập tổng -> Chọn người trả -> Auto Calculate Result ngay bên dưới mà không xé trang.
- **Interaction principles:** Tap ít nhất có thể. KHÔNG Login, KHÔNG nhập rườm rà.

## ⚙️ 4. Functional Requirements
- **FR1 (Manage Players):** Thêm/Xóa/Lưu list locally.
- **FR2 (Create Session):** Chọn người, nhập tiền, phân bổ người trả.
- **FR3 (Calculate Split):** Tự động tính chia đều, auto-update (Reactive UI) khi input đổi.
- **FR4 (Calculate Debt):** Nhận array đầu vào, trả object giao dịch tối ưu (Greedy).
- **FR5 (Export Result):** Format text để copy/share.
- **FR6 (History):** Lưu Session JSON, load UI History.

## 🧠 5. Non-functional Requirements
- **Performance:** Tính toán dưới 100ms.
- **Offline-first:** App hoạt động không cần Internet.
- **Data storage:** Local Storage / IndexedDB (nếu PWA) hoặc SQLite (nếu Native).
- **Tech Stack Recommend:** Làm PWA vói React+Vite (nhanh, gọn nhẹ, chạy ngay trên Safari/Chrome ĐT).

## 🗃️ 6. Data Model (Simple nhưng chuẩn)
*(Ghi chú: Toàn bộ ID sử dụng string UUID, hoặc Timestamp để sinh locally)*

- **Player:** `{ id: string, name: string }`
- **Session:** `{ id: string, created_at: number, total_cost: number, note: string }`
- **SessionPlayer:** `{ session_id: string, player_id: string, amount_paid: number }` 
- **Settlement:** `{ from_player: string, to_player: string, amount: number }` (Lưu kết quả giao dịch)

## 🔥 7. Edge Cases được lường trước
- Tổng tiền không chia hết -> Làm tròn chẵn 1K.
- Nhiều người cùng trả tiền sân lưới.
- Có người chỉ tham gia chơi, chưa trả đồng nào.
- Có người trả hộ dư tiền so với thực tế chi.

## 🚀 8. Future Scope (Roadmap ngoài MVP)
- Quét mã QR code thanh toán (VietQR integration).
- Voice input / Thống kê cá nhân từng tháng.
- Group cố định.

## ✅ 9. Definition of Done (Tiêu chuẩn nghiệm thu)
- [ ] User flow từ mở app đến xem kết quả hoàn thành dưới 10 giây.
- [ ] Kết quả bù trừ luôn bằng tổng tiền ban đầu.
- [ ] Output copy/share được định dạng dễ hiểu trên Zalo.
- [ ] Hoạt động offline hoàn toàn. Tắt đi bật lại không mất lịch sử.
