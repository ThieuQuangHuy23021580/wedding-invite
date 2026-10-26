# Thiệp cưới DŨNG &amp; UYÊN

Bản tái tạo độc lập của trang thiệp cưới `https://e.ewedding.site/DungvaUyen-`,
dựng lại từ đầu bằng HTML/CSS/JS thuần (không framework, không build step).

## Chạy

Mở trực tiếp `index.html` trong trình duyệt, hoặc chạy một static server:

```bash
npx serve .
# hoặc
python -m http.server 5173
```

## Cấu trúc

```
index.html          # 10 section của thiệp
css/style.css       # toàn bộ layout + animation
js/main.js          # countdown, lịch, gallery, nhạc, RSVP
assets/
  img/              # 22 ảnh (webp/png/svg)
  fonts/            # 3 font tuỳ chỉnh của thiệp
  audio/            # nhạc nền
```

## Các section

1. **Hero** — "Save our wedding date", ảnh cưới trong khung vòm
2. **Lễ Thành Hôn** — 20.01.2026, Trống Đồng Palace Hà Đông + nút chỉ đường
3. **Lễ Vu Quy** — 25.01.2026, Grand View Palace Hạ Long + nút chỉ đường
4. **Timeline** — đón khách 11:00, nghi lễ 11:30
5. **Couple** — chú rể Trung Dũng &amp; cô dâu Ngọc Uyên
6. **Our Story** — lời ngỏ + lịch tháng 1/2026 (khoanh ngày 20)
7. **Countdown** — đếm ngược tới giờ cưới
8. **Gallery** — slideshow 8 ảnh, tự chạy + vuốt + nút mũi tên
9. **RSVP** — form xác nhận, lưu vào localStorage
10. **Thank You** — lời cảm ơn + liên kết mạng xã hội

## Ghi chú kỹ thuật

- Canvas cố định **420px** căn giữa, đúng như bản gốc (mọi toạ độ lấy từ phép đo thực tế).
- Font tuỳ chỉnh của thiệp (`Thiep Script`, `Thiep Label`, `Thiep Request`) đã được
  đặt lại tên và self-host trong `assets/fonts/`.
- Ảnh gốc do CDN trả về định dạng WebP dù URL ghi `.jpg`/`.png`; đã đổi phần mở rộng cho khớp.
- Animation reveal dùng `IntersectionObserver`, tôn trọng `prefers-reduced-motion`.
- Nhạc nền chỉ phát sau tương tác đầu tiên (chính sách autoplay của trình duyệt).
