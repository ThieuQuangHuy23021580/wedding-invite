# Thiệp cưới Hoàng Hiệp & Cẩm Vân

Trang thiệp cưới tĩnh, mở từ `index.html` hoặc phục vụ thư mục này qua một static server.

## Cấu trúc

- `index.html`: nội dung trang, cấu hình WebCake và các hiệu ứng bổ sung.
- `css/layout.css`: bố cục và kiểu dáng của trang.
- `js/app.js`: lazy load, hiệu ứng cuộn, nhạc và xử lý RSVP.
- `api/submit.js`: endpoint lưu RSVP vào Google Sheets; cần cấu hình biến môi trường Google Sheets khi triển khai endpoint.
- `assets/`: ảnh, font và nhạc đang dùng.

## Chạy cục bộ

Mở `index.html` trong trình duyệt hoặc chạy một static server, ví dụ:

```bash
npx serve .
```
