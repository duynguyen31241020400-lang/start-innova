# Website StartInnova Club (SIV)

Site tĩnh: không server, không database, không plugin. Nội dung nằm trong thư mục `content/` dưới dạng file JSON, lệnh build ghép chúng thành HTML trong thư mục `dist/`.

## Xem thử trên máy

Cần Node 18 trở lên, không cần cài thêm thư viện.

    node build.mjs
    node serve.mjs

Mở http://localhost:8080. Sửa nội dung xong chạy lại `node build.mjs` là cập nhật.

## Cấu trúc thư mục

- `content/` là toàn bộ chữ của website (thứ duy nhất cần sửa khi đổi nội dung)
- `public/` gồm ảnh, CSS, JS và trang admin. Mọi thứ trong đây được chép nguyên sang `dist/`
- `build.mjs` là bộ dựng trang: layout nằm ở đây, kiểm soát các trang và cách chúng hiển thị
- `dist/` là kết quả build, đây là thứ đưa lên hosting (không sửa tay, build sẽ ghi đè)

## Sitemap

- `/` Trang chủ: hero đen xanh dương, câu giới thiệu, số liệu, ba màn ảnh Gắn kết – Bứt phá – Vươn xa, trụ cột công nghệ, 4 ban, Về SIV, FAQ (ẩn nếu trống), CTA xanh dương
- `/ve-siv/` Về SIV
- `/phong-ban/` và `/phong-ban/<ban>/` cho Operation, Marketing, R&D, External Relations
- `/lien-he/` Liên hệ
- `/du-an/` và `/du-an/<ten>/` chỉ có khi có ít nhất một dự án
- `/doi-tac/` chỉ có khi có ít nhất một đối tác
- `/tuyen-thanh-vien/` chỉ có khi bật đợt tuyển
- `/sitemap.xml`, `/robots.txt` tự sinh, `/admin/` là trang quản lý nội dung

Trang nào chưa có dữ liệu thì không xuất hiện trên menu, trang chủ lẫn sitemap.

## Sửa nội dung ở đâu

- `content/site.json`: tên CLB, khẩu hiệu, mô tả cho Google, thông tin liên hệ. Ô liên hệ nào để trống thì website tự ẩn ô đó
- `content/hero.json`: chữ lớn đầu trang, câu giới thiệu (đặt *chữ* trong dấu sao để tô xanh), câu kêu gọi cuối trang, ba màn ảnh (chữ lớn, mô tả, ảnh, mô tả ảnh, vị trí cắt)
- `content/stats.json`: dãy số liệu ở trang chủ. `content/faq.json`: câu hỏi thường gặp, để trống thì khối tự ẩn
- `content/ve-siv.json`: nội dung trang Về SIV và 3 trụ cột
- `content/phong-ban/*.json`: mỗi ban một file. Điền `jdUrl` để hiện nút mô tả công việc khi đang tuyển
- `content/du-an/*.json`: mỗi dự án một file. Có file là có trang
- `content/doi-tac/*.json`: mỗi đối tác một file. Trường `tier` quyết định hạng và kích thước logo
- `content/tuyen.json`: đặt `enabled` thành `true` và điền `formUrl` để mở đợt tuyển. Trang, nút Ứng tuyển trên header và khối Đang tuyển ở từng ban tự hiện. Hết đợt thì đặt lại `false`

Ví dụ một dự án (`content/du-an/sharing-session-01.json`):

    {
      "title": "SIV Sharing Session 01",
      "slug": "sharing-session-01",
      "date": "2026-12-05",
      "summary": "Một hai câu tóm tắt.",
      "cover": "/images/uploads/bia.jpg",
      "coverAlt": "Mô tả ảnh bìa",
      "body": "Đoạn một.\n\nĐoạn hai.",
      "gallery": [{ "image": "/images/uploads/a.jpg", "alt": "Mô tả ảnh" }],
      "published": true
    }

Ví dụ một đối tác (`content/doi-tac/ten-doi-tac.json`):

    {
      "name": "Tên đối tác",
      "logo": "/images/uploads/logo.png",
      "url": "https://example.com",
      "tier": "Nhà tài trợ Vàng"
    }

Các hạng hợp lệ, theo thứ tự từ to nhất: Đơn vị tổ chức, Đối tác chiến lược, Đối tác dự án, Nhà tài trợ Vàng, Nhà tài trợ Đồng, Đối tác truyền thông.

## Đưa lên mạng

Cách đơn giản nhất là Cloudflare Pages nối với repo GitHub:

- Build command: `node build.mjs`
- Output directory: `dist`
- Gắn domain `startinnovaclub.com` trong phần Custom domains

Hosting miễn phí. Khoản duy nhất phải trả hằng năm là tiền domain, tới hạn thì gia hạn.

Cũng có thể build trên máy rồi tải nội dung thư mục `dist/` lên bất kỳ hosting nào (kể cả hosting đã mua sẵn). Site chỉ gồm file tĩnh nên chỗ nào cũng chạy.

## Trang quản lý nội dung (/admin)

Dùng Sveltia CMS, giao diện dạng form để các bạn không phải đụng vào code. Cấu hình ở `public/admin/config.yml`.

Việc cần làm một lần:

- Đổi `duynguyen31241020400-lang/start-innova` trong `public/admin/config.yml` thành repo GitHub thật của website
- Cấp quyền ghi repo cho các bạn sẽ quản lý nội dung (tài khoản GitHub)
- Vào `/admin`, đăng nhập GitHub. Sửa xong bấm lưu thì hosting tự build lại

Lưu ý: phần admin chưa được thử trên môi trường thật vì cần repo và tài khoản GitHub. Lần đầu nối repo hãy thử sửa một mục nhỏ để kiểm tra.

## SEO

Đã có sẵn: HTML hoàn chỉnh, tiêu đề và mô tả riêng cho từng trang, Open Graph (chia sẻ Facebook, Zalo hiện ảnh và tiêu đề), sitemap, robots, dữ liệu Organization cho Google.

Việc làm một lần: thêm domain vào Google Search Console và nộp `https://startinnovaclub.com/sitemap.xml`.

Khi thêm dự án, nhớ điền mô tả cho mọi ảnh (ô `alt`), tiêu đề và mô tả riêng nếu muốn tùy chỉnh trên Google.

## Nhờ Claude sửa

Nếu cần đổi giao diện hoặc thêm loại trang mới, mở Claude, đưa cho nó cả thư mục này và nói rõ cần gì. Toàn bộ layout nằm trong `build.mjs` và `public/css/style.css`, nội dung nằm trong `content/`, nên Claude chỉ cần đọc hai chỗ đó.

## Việc còn để trống

- Link fanpage, email CLB, số điện thoại, địa chỉ, các mạng xã hội: điền trong `content/site.json`
- Dự án, đối tác, đợt tuyển: thêm khi có
