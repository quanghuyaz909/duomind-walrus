# Hướng dẫn nộp bài - săn tất cả hạng mục Walrus Sessions 8

Hạn chót: **09/10/2026, 2:00 PM UTC = 21:00 giờ Việt Nam ngày 09/10**. Công bố 16/10.
Mục tiêu: nộp xong trước **tối 08/10** để còn dư một ngày xử lý sự cố.

Mọi nội dung copy-paste (mô tả, bug, ý tưởng, bài X) nằm trong
[submission-pack.md](submission-pack.md). File này là **thứ tự làm và cách làm từng bước**.

## 1. Bản đồ giải thưởng: anh đủ điều kiện hạng mục nào

| Hạng mục | Giải | Trạng thái | Việc anh cần làm |
|---|---|---|---|
| Best Chatbot | $500 / $250 / $150 | Đủ điều kiện, app đã live | Dùng thật vài ngày, nộp form DeepSurge |
| Beyond the Big Two (không Claude/GPT) | 2 x $150 | **Đủ điều kiện sẵn** (Qwen qua Groq) | Ghi rõ model + friction trong form (đã soạn) |
| Best Article | 3 x $100 | Bài đã có, cần anh chỉnh và đăng | Đăng Medium hoặc Inkray |
| Promo Prize | 5 x $100 | Chưa làm, **không cần chatbot** | Đăng giới thiệu ở cộng đồng bên thứ ba + form riêng |
| Bug Bounty | 5 x $100 | Chưa có bug nộp được (xem mục 7) | Chỉ nộp bug **thật, tái hiện được, chưa ai báo** |

Quy tắc quan trọng: **mỗi người chỉ 1 bài nộp chatbot**. Best Chatbot và Beyond the Big Two
xét từ cùng 1 bài nộp, nên 1 lần nộp là tham gia cả hai. Promo và Bug Bounty dùng form riêng
(link ở cuối) và nộp được dù không làm chatbot.

## 2. Lịch làm việc đề xuất (hôm nay 04/10)

- **04/10 (hôm nay):** tạo ví Sui riêng, join Discord, đăng ký DeepSurge, bắt đầu dùng app thật.
- **05-06/10:** dùng app mỗi ngày (web + Telegram), rủ 1-2 bạn, chụp màn hình.
- **07/10:** chỉnh bài, thêm ảnh, đăng bài, đăng X, đăng bài Promo.
- **08/10:** nộp form DeepSurge, form Promo/Bug (nếu có), kiểm tra lại mọi link.
- **09/10 sáng:** dự phòng. Đừng để tới phút cuối.

## 3. Việc chuẩn bị (làm hôm nay, 20 phút)

### 3.1. Ví Sui riêng để nhận thưởng
1. Cài ví Sui (Slush hoặc Sui Wallet), tạo **ví mới** chỉ dùng cho Session.
2. Ghi 12 từ khôi phục ra giấy, cất kỹ. **Không bao giờ gửi cụm từ này cho ai, kể cả mình.**
3. Chỉ copy **địa chỉ ví** (dạng `0x...`) để dán vào form. Địa chỉ thì công khai được.
4. Khi trúng giải, ban tổ chức hỏi địa chỉ trong 21 ngày sau thông báo và có thể yêu cầu
   giao dịch thử để xác nhận ví nhận được WAL. Tự chịu rủi ro nếu gõ sai địa chỉ.

### 3.2. Discord
Vào trang thể lệ https://thewalrussessions.wal.app/ , bấm link Discord ở đó và tham gia.
Thể lệ có yêu cầu join Discord, và đây cũng là nơi hỏi ban tổ chức nếu có câu hỏi.

### 3.3. Đăng ký DeepSurge
1. Mở https://www.deepsurge.xyz/hackathons/c0141a4a-21be-4009-bc63-7c168608c849
2. Tạo tài khoản, bấm đăng ký tham gia (Register).
3. Điền thông tin dự án (lấy từ bảng ở submission-pack.md): tên **DuoMind**, mô tả,
   người liên hệ, tài khoản GitHub.

## 4. Dùng thật (quan trọng nhất cho tiêu chí "Real-World Use")

Giám khảo chấm "bằng chứng dùng thật", không chấm số lượng người. Cách làm:
1. Đăng nhập web (tên + mật khẩu), bấm **Add recovery** để gắn Telegram (làm thật các bước).
2. Mỗi ngày kể cho bot 2-3 chi tiết **thật** về người yêu hoặc bạn bè (sinh nhật, món thích,
   lời hứa, kế hoạch). Nhắn cả trên web và Telegram, thử `/link` để thấy chung 1 bộ nhớ.
3. Vài ngày sau hỏi "gợi ý quà cho Mai" và chụp màn hình khi bot **tự nhắc lại đúng chi tiết
   cũ**. Đây là ảnh trước/sau quý nhất cho bài viết.
4. Để có bằng chứng **nhắc lịch tự động**: kể một sinh nhật rơi trong 3 ngày tới. Hệ thống
   quét mỗi ngày lúc 09:00 UTC (16:00 giờ VN) và nhắn lại. Chụp tin nhắn nhắc đó.
5. Rủ 1-2 người dùng thử (không bắt buộc nhưng làm bài thuyết phục hơn nhiều).

Lưu ý có thật đã đo: relayer giới hạn **60 request/phút cho mỗi delegate key**, dùng chung cả
app. Mỗi tin nhắn tốn khoảng 3-5 request, nên đừng cho 20 người vào cùng một phút. Dùng bình
thường thì không sao. Đây là điều đáng ghi vào bài ở phần "What I'd improve".

## 5. Bài viết (Best Article)

Bài nằm ở [article-draft.md](article-draft.md). Ban giám khảo chấm: **rõ ràng, trung thực, hữu
ích cho người mới**. Bài đã có sẵn đoạn "tích hợp trong 20 dòng" cho người mới và câu chuyện
bug thật. Việc của anh:
1. Đọc lại toàn bộ, **sửa giọng văn thành giọng của anh** (đừng để đọc như văn máy).
2. Thêm 3-4 ảnh chụp thật: màn hình chat, đoạn bot nhớ lại, trang walruscan của blob, tin
   nhắn nhắc lịch.
3. Thay "Evidence of real use" bằng số liệu của anh sau vài ngày dùng (số ngày, số blob,
   ví dụ cụ thể). Giữ nguyên tinh thần trung thực: nói rõ app do 1 người dùng chính.
4. Đăng lên **Medium** hoặc **Inkray** (cả hai đều được). Copy link bài đã đăng.
5. Đừng bịa số liệu hay hội thoại: bài giám khảo đọc ra "giả" sẽ mất điểm hơn bài ngắn mà thật.

## 6. Đăng X và Promo

### 6.1. Đăng X (bắt buộc theo thể lệ)
Dán bài X trong submission-pack.md, thay `<ARTICLE LINK>`. Phải **tag @WalrusProtocol** và có
**#WalrusMemory**. Copy link bài X để dán vào form.

### 6.2. Promo Prize ($100, 5 giải, không cần chatbot)
Đăng một bài **giới thiệu Session** (không phải khoe dự án) ở **cộng đồng bên thứ ba**:
subreddit, diễn đàn, hoặc newsletter. **X và các kênh Sui/Walrus không được tính.**
- Chọn nơi mà chủ đề phù hợp và **đọc luật cộng đồng đó trước** (nhiều nơi cấm quảng cáo).
- Bài nên có ích thật: nói Session là gì, hạn chót, giải thưởng, link thể lệ. Nội dung gợi ý:
  "Walrus Sessions 8 đang mở: xây chatbot có trí nhớ, giải $2.500 WAL, hạn 09/10. Thể lệ: ...".
- Không spam nhiều nơi cùng 1 lúc, dễ bị xóa và tính là kém chất lượng.
- Lưu lại link bài đăng, nộp qua form riêng (link dưới). Nếu không chắc một nơi có hợp lệ
  không, hỏi ban tổ chức trên Discord trước.

## 7. Bug Bounty ($100, 5 giải, không cần chatbot)

Phải là issue chất lượng ở **github.com/MystenLabs/MemWal** có: các bước tái hiện, môi
trường (phiên bản SDK, Node, hệ điều hành), kết quả thực tế vs mong đợi. Hiện có hơn 50 issue
đang mở và nhiều người cùng săn, nên **trùng với issue đã có là không tính**.

Mình đã dò SDK 0.1.8 và kiểm tra trùng lặp:
- `MemWal.create()` nhận key sai: **trùng** #1041.
- `remember("   ")` (toàn khoảng trắng) được chấp nhận: **trùng** #974.
- `recall(limit -5)` lộ lỗi serde thô: gần với #1088, **rủi ro trùng**.
- Ký tự NUL (`\u0000`) trong `remember()`: đã thử, ghi và đọc lại bình thường, **không phải bug**.
- Nhiều đầu vào rỗng khác (`recall` query rỗng, namespace rỗng, `listNamespaces` limit 0/âm,
  cursor sai, `rememberBulk([])`): SDK/relayer báo lỗi 400 rõ ràng, **không phải bug**.

Kết luận thật: sau khi dò, **mình chưa tìm được bug mới nào đủ điều kiện nộp**. Đừng nộp bug
trùng để cho có. Nếu muốn săn giải này nghiêm túc, hướng khả thi là dùng SDK ở chỗ ít người
đụng (Python SDK, MCP server, `restore`, `rememberBulk`, luồng đồng thời) và tự tái hiện trước.

Cách làm thật sự: trước khi nộp, **tìm trong Issues bằng từ khóa** để chắc chưa ai báo, rồi mới
mở issue. Một issue ít nhưng chất lượng và không trùng giá trị hơn 5 issue trùng. Đừng nộp bug
mà mình hay anh chưa tự tái hiện được.

## 8. Nộp bài chính trên DeepSurge

Chuẩn bị đủ 8 thứ trước khi bấm nộp:
1. Repo: https://github.com/quanghuyaz909/duomind-walrus (đang public)
2. Model: Qwen (`qwen/qwen3.8-27b`) qua Groq
3. Link web: https://walrus-memory-chatbot.vercel.app
4. Link Telegram: https://t.me/DuoMindd_bot
5. Link bài Medium/Inkray (sau khi đăng)
6. Link bài X (sau khi đăng)
7. Địa chỉ ví Sui riêng
8. 1 bug + 1 ý tưởng cải tiến (copy từ submission-pack.md)

Sau khi nộp: mở lại trang dự án trên DeepSurge **bằng cửa sổ ẩn danh** để chắc giám khảo thấy
đúng nội dung và các link bấm được.

## 9. Kiểm tra cuối (làm sáng 08-09/10)

- [ ] Web mở được, đăng nhập được, nhắn thử 1 câu và hỏi lại được
- [ ] Bot Telegram trả lời `/start`
- [ ] Repo public, README đủ, không có file `.env` hay khóa bí mật nào bị lộ
- [ ] Bài đã đăng, link bấm được ở cửa sổ ẩn danh
- [ ] Bài X đã đăng, có @WalrusProtocol và #WalrusMemory
- [ ] Đã join Discord
- [ ] Form đã gửi, có trang xác nhận

## Link tham khảo
- Chi tiết: https://www.deepsurge.xyz/hackathons/c0141a4a-21be-4009-bc63-7c168608c849
- Thể lệ: https://thewalrussessions.wal.app/
- Form riêng Promo / Bug Bounty: https://walform.wal.app/f?formId=0x38a736485349b133604c1caf286d669b4b774d16f0a26120ce839cad245baeef
- Repo MemWal: https://github.com/MystenLabs/MemWal
