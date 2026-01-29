# Ứng Dụng Đọc Báo cho BlackBerry Passport

Ứng dụng web đơn giản để đọc tin tức từ các báo Việt Nam, được tối ưu hóa cho BlackBerry Passport chạy BB10 OS.

## Tính năng

- ✅ Chỉ hiển thị văn bản, không có hình ảnh
- ✅ Tối ưu cho màn hình vuông BlackBerry Passport (1440x1440px)
- ✅ Giao diện tối (Dark theme) dễ đọc
- ✅ Hỗ trợ 3 nguồn tin: VnExpress, Tuổi Trẻ, Thanh Niên
- ✅ Cập nhật tin tức theo thời gian thực qua RSS feed
- ✅ Hoàn toàn responsive và tương thích với BB10 WebKit

## Cách Deploy lên Vercel

### Bước 1: Chuẩn bị

1. Tạo tài khoản tại [vercel.com](https://vercel.com)
2. Cài đặt Vercel CLI (tùy chọn):
```bash
npm install -g vercel
```

### Bước 2: Deploy qua Vercel CLI (Khuyến nghị)

1. Mở terminal và di chuyển đến thư mục chứa code:
```bash
cd /path/to/your/project
```

2. Đăng nhập Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Làm theo hướng dẫn:
   - Set up and deploy? `Y`
   - Which scope? Chọn tài khoản của bạn
   - Link to existing project? `N`
   - What's your project's name? Nhập tên (vd: `bb-news-reader`)
   - In which directory is your code located? `./`
   - Want to override the settings? `N`

5. Deploy production:
```bash
vercel --prod
```

### Bước 3: Deploy qua GitHub (Cách thay thế)

1. Tạo repository mới trên GitHub
2. Upload các file: `index.html`, `styles.css`, `app.js`, `vercel.json`
3. Vào [vercel.com/dashboard](https://vercel.com/dashboard)
4. Click "Add New" → "Project"
5. Import repository GitHub của bạn
6. Click "Deploy"

## Cấu trúc File

```
.
├── index.html      # Trang chính
├── styles.css      # CSS tối ưu cho BB Passport
├── app.js          # Logic ứng dụng
├── vercel.json     # Cấu hình Vercel
└── README.md       # Hướng dẫn
```

## Sử dụng trên BlackBerry Passport

1. Mở trình duyệt BlackBerry Browser
2. Truy cập URL được Vercel cung cấp (vd: `https://your-app.vercel.app`)
3. Thêm vào bookmark để truy cập nhanh
4. (Tùy chọn) Thêm vào home screen bằng menu browser

## Tính năng kỹ thuật

- **Không cần backend**: Hoàn toàn chạy trên client-side
- **RSS Parser**: Sử dụng API rss2json.com để chuyển đổi RSS feeds
- **Tối ưu hóa**: 
  - Không load hình ảnh
  - Font size phù hợp với màn hình nhỏ
  - Sticky header để điều hướng dễ dàng
  - Touch-optimized cho BB10

## Nguồn tin tức

- **VnExpress**: Tin tức tổng hợp
- **Tuổi Trẻ**: Tin tức thời sự
- **Thanh Niên**: Tin tức xã hội

## Giới hạn

- RSS feeds có thể bị giới hạn bởi CORS policies
- Một số báo có thể thay đổi định dạng RSS
- API rss2json.com có giới hạn 10,000 requests/day (free tier)

## Tùy chỉnh

Để thêm nguồn tin khác, chỉnh sửa trong `app.js`:

```javascript
const RSS_FEEDS = {
    vnexpress: 'https://vnexpress.net/rss/tin-moi-nhat.rss',
    tuoitre: 'https://tuoitre.vn/rss/tin-moi-nhat.rss',
    thanhnien: 'https://thanhnien.vn/rss/home.rss',
    // Thêm nguồn mới tại đây
    baomoiSource: 'https://example.com/rss'
};
```

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console log trong browser
2. Đảm bảo RSS feed URL còn hoạt động
3. Kiểm tra kết nối internet của BB Passport

## License

MIT License - Tự do sử dụng và chỉnh sửa
