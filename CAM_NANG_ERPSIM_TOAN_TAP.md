# CẨM NANG TOÀN TẬP ERPSIM (JOB AID, CHỨC NĂNG TỪNG NÚT BẤM & QUY TRÌNH CHUẨN)

Tài liệu này giải thích chi tiết **quy trình vận hành vòng lặp khép kín trong ERPsim**, **ý nghĩa từng mã lệnh (T-Code / Fiori Tile)**, **từng nút bấm cụ thể trên màn hình SAP GUI & SAP Fiori**, cách **phân chia vị trí trong đội (4 người)** và **cách xử lý các lỗi thường gặp nhất khi đang thi đấu**.

---

## PHẦN 1: BỨC TRANH TỔNG THỂ — VÒNG LẶP 5 BƯỚC TRONG ERPSIM

Trong ERPsim Manufacturing, công ty của bạn **không tự động có hàng để bán**. Hệ thống SAP chỉ tự động làm giúp bạn 2 việc ngầm định:
1. **Nhận hàng tự động (Goods Receipt)** sau khi hết thời gian chờ giao hàng (Lead time 1–5 ngày) của đơn mua nguyên vật liệu (`ME59N`).
2. **Giao hàng & Xuất hóa đơn tự động (Sales Order $\to$ Delivery $\to$ Invoice)** khi bot khách hàng đặt mua **NẾU** trong kho của bạn (`ZMB52`) đang có sẵn thành phẩm và bạn đã niêm yết giá (`VK32`).

Toàn bộ các khâu còn lại bắt buộc đội bạn phải bấm nút theo đúng **Chuỗi 5 bước tuần tự** sau:

```
[Bước 1: MD61] ──> [Bước 2: MD01] ──> [Bước 3: ME59N] ──> [Bước 4: CO41] ──> [Bước 5: VK32 & ZADS]
 Lập Dự báo         Chạy MRP tính      Đặt mua Nguyên     Chuyển lệnh Kế     Đặt Giá bán & Chi
 Sản xuất (PIR)     toán thiếu hụt     vật liệu từ NCC    hoạch -> Sản xuất  tiền Quảng cáo Vùng
```

> ⚠️ **CẢNH BÁO SỐNG CÒN**: Nếu bạn sửa `MD61` mà quên chạy `MD01`, hệ thống sẽ không sinh ra nhu cầu mới. Nếu bạn chạy `MD01` mà quên bấm `ME59N` (mua nguyên vật liệu) hoặc `CO41` (lệnh cho nhà máy chạy), nhà máy sẽ **ĐỨNG HÌNH**!

---

## PHẦN 2: GIẢI NGHĨA CHI TIẾT TỪNG MÀN HÌNH & TỪNG NÚT BẤM (SAP GUI & FIORI)

### NHÓM A: HOẠCH ĐỊNH & MUA HÀNG (PLANNING & PROCUREMENT)

#### 1. `MD61` — Create Planned Independent Requirements (Lập Dự Báo Sản Xuất)
* **Tên trên SAP Fiori**: *Maintain PIRs* hoặc *Create Planned Independent Requirements*.
* **Chức năng**: Khai báo cho SAP biết bạn **muốn có bao nhiêu hộp thành phẩm** cho từng mã (`F01`..`F16`). Con số này chính là "đầu vào" để MRP tính toán lượng nguyên vật liệu cần mua và số lệnh sản xuất cần mở.
* **Các nút bấm & thao tác chuẩn**:
  1. Chọn ô tròn **`Product group`** (Nhóm sản phẩm) $\to$ Nhập **`$$-F`** (trong đó `$$` là mã chữ cái của đội bạn, ví dụ đội A thì nhập **`AA-F`**, đội Z nhập **`ZZ-F`**).
  2. **Plant (Nhà máy)**: Nhập mã nhà máy của đội (ví dụ **`AA`** hoặc **`ZZ`**).
  3. Bấm **`Enter`** (hoặc nút tích xanh góc trên bên trái) để vào bảng nhập số lượng.
  4. **Cột Cỡ lô / Nhu cầu (Period/Month cột thứ 2 hoặc cột hiện tại)**: Nhập số lượng hộp muốn sản xuất cho từng mã (ví dụ: **`24000`** hoặc **`30000`** cho 3–4 mã chủ lực; các mã không kinh doanh thì để **`0`**).
  5. Bấm nút **`Save` (Biểu tượng đĩa mềm `Ctrl + S`)** ở thanh công cụ trên cùng. *(Nếu không bấm Save, mọi con số vừa gõ sẽ biến mất!)*.

---

#### 2. `MD01` — MRP Run (Chạy Hoạch Định Nhu Cầu Nguyên Vật Liệu)
* **Tên trên SAP Fiori**: *Execute MRP* hoặc *MRP Run*.
* **Chức năng**: Bộ não tính toán của SAP. Khi bấm chạy, SAP lấy số dự báo ở `MD61` trừ đi lượng tồn kho hiện có trong `ZMB52`, rồi **nhân với định mức công thức BOM (`ZCS02`)** để tự động đẻ ra:
  * **Planned Orders (Lệnh sản xuất kế hoạch)** cho thành phẩm.
  * **Purchase Requisitions (Yêu cầu mua hàng)** cho hạt, trái cây, yến mạch, túi nilon (Bag) và vỏ hộp (Box).
* **Các nút bấm & thông số bắt buộc phải chọn đúng**:
  1. **Plant**: Nhập mã nhà máy đội bạn (ví dụ `AA`).
  2. **Processing Key**: Chọn **`NEUPL`** (Regenerative Planning – Lập kế hoạch tái tạo toàn bộ).
  3. **Create Purchase Req.**: Phải đổi sang số **`1`** (*Purchase requisitions* – Luôn tạo yêu cầu mua hàng trực tiếp).
  4. **SA Deliv. Sched. Lines**: Chọn **`3`** (*Schedule lines*).
  5. **Create MRP List**: Chọn **`1`** (*MRP list*).
  6. **Planning Mode**: Chọn **`3`** (*Delete and recreate planning data* – Xóa dữ liệu kế hoạch cũ chưa chốt và tính lại từ đầu).
  7. **Scheduling**: Chọn **`1`** (*Basic dates*).
  8. **Cách bấm chạy**: Bấm **`Enter`**, SAP sẽ hiện dòng chữ cảnh báo màu vàng ở góc dưới đáy màn hình (*"Please check input parameters"*). Bạn phải bấm **`Enter` LẦN THỨ HAI** để máy thực sự chạy! Khi màn hình hiện bảng thống kê số Material đã xử lý là thành công.

---

#### 3. `ME59N` — Automatic Generation of Purchase Orders (Tự Động Chốt Đơn Mua Nguyên Vật Liệu)
* **Tên trên SAP Fiori**: *Create Purchase Orders* hoặc *Convert Purchase Requisitions*.
* **Chức năng**: Chuyển các "Yêu cầu mua hàng" vừa được `MD01` sinh ra thành **Đơn đặt hàng chính thức (Purchase Order - PO)** gửi tới nhà cung cấp.
* **Các nút bấm & thao tác chuẩn**:
  1. Tại mục **Purchasing Organization** (Tổ chức mua hàng) và **Plant**: Nhập mã đội của bạn (ví dụ `AA`).
  2. **QUAN TRỌNG NHẤT**: Bỏ dấu tích (Uncheck) ở ô **`Test Run`**! Nếu để dấu tích ở `Test Run`, hệ thống chỉ chạy thử chứ **không hề mua hàng thật**.
  3. Bấm nút **`Execute` (Biểu tượng chiếc đồng hồ có dấu tích hoặc phím `F8`)** ở góc trên bên trái.
  4. Màn hình tiếp theo hiện danh sách các PO đã được tạo kèm thông báo màu xanh lá cây (*"Purchase order ... created"*) là hoàn tất.
* **Lưu ý thời gian giao hàng (Lead Time)**: Sau khi chạy `ME59N`, nguyên vật liệu mất từ **1 đến 5 ngày mô phỏng** mới tự động về kho (`ZME2N` để xem ngày hàng về).

---

### NHÓM B: SẢN XUẤT & CÔNG THỨC (PRODUCTION & BOM)

#### 4. `CO41` — Collective Conversion of Planned Orders (Chuyển Lệnh Kế Hoạch Thành Lệnh Sản Xuất Thật)
* **Tên trên SAP Fiori**: *Convert Planned Orders*.
* **Chức năng**: Đẩy các lệnh sản xuất dự kiến từ `MD01` xuống xưởng máy để công nhân bắt đầu đóng hộp Muesli.
* **Các nút bấm & thao tác chuẩn**:
  1. **Planning Plant**: Nhập mã đội bạn (ví dụ `AA`).
  2. Bấm nút **`Execute` (`F8`)**.
  3. Màn hình hiện ra danh sách các lệnh dự kiến (Planned Orders) với số lượng từng lô (thường chia theo cỡ lô tối thiểu 16,000 hoặc 24,000 hộp).
  4. **Cách chọn lệnh để sản xuất**:
     * Tích chọn vào ô vuông đầu dòng của những mã hàng bạn muốn đưa vào dây chuyền ngay (hoặc bấm nút **`Select All` / Biểu tượng chọn tất cả** nếu muốn đẩy hết).
     * *Mẹo tối ưu*: Chỉ nên giữ từ **2 đến 4 lệnh sản xuất trong hàng đợi** (`ZCO11`) để dễ xoay chuyển khi thị trường đổi chiều, và **ưu tiên xếp các lệnh có cùng mã SKU chạy liên tiếp nhau** để không tốn 2–8 tiếng Setup Time!
  5. Bấm nút **`Convert` (Nút có biểu tượng bánh răng / chữ *Collective Conversion*)** trên thanh công cụ.

---

#### 5. `ZCO11` / `COOIS` — Production Schedule / Production Order Information (Theo Dõi Tiến Độ Dây Chuyền)
* **Tên trên SAP Fiori**: *Production Schedule*.
* **Chức năng**: Xem nhà máy đang chạy mã nào, còn bao nhiêu hộp nữa thì xong lô hiện tại, và thứ tự các lô đang xếp hàng chờ sản xuất.
* **Ý nghĩa cảnh báo**: Nếu bạn thấy lệnh sản xuất đứng yên không tăng số lượng `Confirmed Quantity`, 99% là do **kho đã hết 1 loại nguyên vật liệu nào đó** (thường là hết `Bag` - túi hoặc `Box` - hộp giấy, kiểm tra ngay trong `ZMB52`).

---

#### 6. `ZCS02` (hoặc `CS02`) — Change Bill of Material (Sửa Công Thức Sản Phẩm BOM)
* **Tên trên SAP Fiori**: *Change Bill of Material*.
* **Chức năng**: Thay đổi tỷ lệ hạt (Nuts), nho khô (Raisins), việt quất (Blueberries), dâu tây (Strawberries), yến mạch (Oats), lúa mì (Wheat) trong 1 hộp Muesli để nâng cao chất lượng thu hút khách hàng hoặc giảm giá thành.
* **Quy tắc khóa của hệ thống**:
  * Bạn **KHÔNG THỂ** sửa công thức của một mã (ví dụ `F02`) nếu trong kho `ZMB52` **vẫn còn tồn kho mã `F02` > 0** hoặc đang có lệnh sản xuất `F02` dở dang. Vì vậy, muốn nâng cấp công thức thì phải sửa ngay **Ngày 1 của Round 1** (trước khi sản xuất) hoặc đợi lúc bán hết sạch tồn kho mã đó.
  * Tổng khối lượng các thành phần ruột bên trong hộp `500g` phải đúng bằng **`0.50 kg`**, và hộp `1kg` phải đúng bằng **`1.00 kg`**.

---

### NHÓM C: BÁN HÀNG & MARKETING (SALES & MARKETING)

#### 7. `VK32` — Change Price List (Thay Đổi Bảng Giá Bán Theo Kênh)
* **Tên trên SAP Fiori**: *Change Price List*.
* **Chức năng**: Cập nhật giá bán cho từng mã sản phẩm trên 3 kênh phân phối (`DC10`, `DC12`, `DC14`). Giá đổi có hiệu lực **ngay ở ngày mô phỏng kế tiếp**.
* **Các nút bấm & thao tác chuẩn**:
  1. Mở `VK32`, bấm đúp vào thư mục **`Prices` $\to$ `Price List Price`**.
  2. Bấm nút **`Execute` (`F8`)**.
  3. Màn hình hiện ra 3 bảng (hoặc danh sách gộp theo cột **`Distribution Channel`** `10`, `12`, `14`):
     * **Kênh `10` (Hypermarkets)**: Chỉ có tác dụng với hộp **1kg (`F11`..`F16`)**.
     * **Kênh `12` (Grocery Chains)**: Mua cả hộp **500g và 1kg (`F01`..`F16`)**.
     * **Kênh `14` (Independent Grocers)**: Chỉ có tác dụng với hộp **500g (`F01`..`F06`)**.
  4. Sửa giá trực tiếp tại cột **`Amount`** (dùng dấu chấm hoặc dấu phẩy thập phân tùy định dạng máy SAP của trường, hãy nhìn định dạng có sẵn trên màn hình!).
  5. Bấm **`Save` (`Ctrl + S`)**.
  * *Cảnh báo*: Khi một người trong đội đang mở `VK32`, người khác vào `VK32` sẽ bị báo lỗi **"Data is locked by user..."**. Người phụ trách giá sau khi Save xong nên bấm **`Back` (`F3`)** thoát ra ngoài.

---

#### 8. `ZADS` — Marketing Expense Planning (Chi Tiền Quảng Cáo Theo Vùng)
* **Tên trên SAP Fiori**: *Marketing Expense* hoặc *Plan Marketing*.
* **Chức năng**: Đặt ngân sách quảng cáo **theo từng ngày** cho từng mã sản phẩm tại 3 vùng: **`North`**, **`South`**, **`West`**.
* **Cơ chế nút bấm**:
  1. Nhập số tiền (Euro) vào ô giao giữa **Mã SKU** và **Vùng (North / South / West)**.
  2. Bấm **`Save` (`Ctrl + S`)** (hoặc nút *Apply/Post*).
  3. **CỰC KỲ LƯU Ý**: Số tiền bạn nhập trong `ZADS` là **chi phí tự động lặp lại MỖI NGÀY (Daily Recurring Expense)**! Ví dụ bạn nhập `€2,000` vào một ô rồi để đó 10 ngày thì hệ thống sẽ trừ của bạn `€20,000`. Khi một sản phẩm sắp hết hàng hoặc ở **3–4 ngày cuối của Round cuối**, phải vào `ZADS` xóa về **`0`** và bấm **`Save`**!

---

### NHÓM D: TÀI CHÍNH, ĐẦU TƯ LEAN & VAY NỢ (FINANCE & CONTROLLING)

#### 9. `FB50` (hoặc `ZFB50`) — Enter G/L Account Document (Đầu Tư Lean Manufacturing `478000` & Mở Rộng Công Suất `11000`)
* **Tên trên SAP Fiori**: *Post General Journal Entries* hoặc *Lean Manufacturing / Capital Investment*.
* **Chức năng**: Dùng để rót tiền vào tài khoản **`478000` (Lean Manufacturing)** nhằm giảm thời gian chuyển đổi dây chuyền (Setup Time) từ 8 giờ xuống 4–5 giờ, hoặc đầu tư vào **`11000` (Machinery)** để tăng công suất nhà máy.
* **Thao tác bấm nút chuẩn trong `FB50`**:
  1. **Document Date & Posting Date**: Chọn ngày hôm nay (bấm `F4` rồi bấm `F2` để lấy nhanh ngày hiện tại).
  2. Tại bảng dòng định khoản bên dưới, nhập 2 dòng:
     * **Dòng 1**: Cột *G/L Acct* nhập **`478000`** (Lean Manufacturing) | Cột *D/C* chọn **`Debit` (Nợ)** | Cột *Amount in doc.curr.* nhập số tiền (ví dụ **`250000`** hoặc **`500000`**) | Cột *Cost Center* (nếu yêu cầu) nhập mã trung tâm chi phí sản xuất của đội (ví dụ **`AA-P`** hoặc chọn từ `F4`).
     * **Dòng 2**: Cột *G/L Acct* nhập **`113100`** (Tài khoản Tiền gửi ngân hàng / Bank Cash) | Cột *D/C* chọn **`Credit` (Có)** | Cột *Amount in doc.curr.* nhập đúng số tiền tương ứng (**`250000`** hoặc **`500000`**).
  3. Bấm **`Enter`** để đèn trạng thái chuyển sang **Màu xanh lá** (Cân bằng Nợ = Có).
  4. Bấm nút **`Post` / `Save` (`Ctrl + S`)**.

---

#### 10. `ZFF7B` / `F.01` — Cash Management, Loans & Financial Statements (Báo Cáo Tài Chính & Trả Nợ Vay)
* **`F.01` (Financial Statements)**: Xem **Bảng cân đối kế toán (Balance Sheet)** và **Báo cáo kết quả kinh doanh (P&L / Current Profit)**. Đây là nơi bạn lấy 4 con số: `Cash`, `Accounts Receivable`, `Bank Loans`, `Accounts Payable` để nhập vào **Tab 1 của bộ công cụ Web** nhằm kiểm soát hạng tín dụng **`AAA+`**.
* **`ZLOAN` / `ZFF7B` (Quản lý Vay ngân hàng)**: Dùng để trả bớt nợ vay khi tiền mặt dư thừa nhằm giảm chi phí lãi vay và đẩy `Debt Loading >= 0`.

---

### NHÓM E: 5 BÁO CÁO QUAN TRỌNG NHẤT ĐỂ QUAN SÁT THỊ TRƯỜNG (REPORTS)

| Mã Lệnh (T-Code) | Tên Báo Cáo | Dùng Để Xem Gì Trong Trận Đấu? | Tần Suất Mở |
| :--- | :--- | :--- | :--- |
| **`ZMB52`** | **Warehouse Stock (Tồn kho)** | Kiểm tra tồn kho **Thành phẩm (`F01..F16`)** và **Nguyên vật liệu (`Bag`, `Box`, `Oats`, `Fruit`...)**. Nếu mã nào về `0` là đang bị đứt hàng! | **Mỗi 1–2 ngày** |
| **`ZVC2`** | **Summary Sales Report (Doanh số tổng hợp)** | Xem mỗi ngày đội mình bán được bao nhiêu hộp của từng SKU ở từng **Vùng (North, South, West)** và từng **Kênh (DC10, DC12, DC14)**. | **Mỗi 2 ngày** |
| **`ZMARKET`** | **Price Market Report (Báo cáo giá thị trường)** | Xem **Giá trung bình của toàn thị trường** và tổng doanh số toàn ngành cho từng mã hàng. Dùng để biết đối thủ đang bán đắt hay rẻ hơn mình. | **Mỗi 2–3 ngày** |
| **`ZCK11`** | **Product Costing (Giá vốn sản phẩm)** | Xem **Chi phí sản xuất trên 1 hộp (COGS)** của từng mã hàng (đã gồm nguyên vật liệu + phân bổ chi phí cố định nhà máy). Không bao giờ đặt giá bán `VK32` thấp hơn con số này! | **Đầu mỗi Round** |
| **`ZME2N`** | **Purchase Order Tracking (Theo dõi đơn mua NVL)** | Xem các đơn mua nguyên vật liệu từ `ME59N` sẽ cập bến kho vào đúng **Step (Ngày) thứ mấy**. | **Khi sắp cạn NVL** |

---

## PHẦN 3: PHÂN CHIA VỊ TRÍ ĐỘI HÌNH 3–4 NGƯỜI CHUẨN THI ĐẤU QUỐC TẾ

Trong một trận đấu ERPsim (thời gian trôi rất nhanh, khoảng 45–60 giây đời thực = 1 ngày mô phỏng), nếu cả đội cùng bấm loạn xạ sẽ gây **khóa dữ liệu (Lock conflict)**. Hãy chia đội thành **4 vị trí độc lập**:

1. **Vị trí 1 — Giám đốc Chuỗi Cung Ứng & Sản Xuất (Supply & MRP Controller)**:
   * **Màn hình phụ trách**: `ZMB52`, `MD61`, `MD01`, `ME59N`, `CO41`, `ZCO11`.
   * **Nhiệm vụ**: Đảm bảo nhà máy chạy liên tục 100% công suất, không bao giờ đứt nguyên vật liệu (đặc biệt là túi `Bag` và hộp `Box`), và gom lô sản xuất lớn để tránh mất Setup Time.
2. **Vị trí 2 — Giám đốc Định Giá & Phân Tích Đối Thủ (Pricing & Market Strategist)**:
   * **Màn hình phụ trách**: `ZMARKET`, `ZCK11`, `VK32` + **Tab 2 của Web Command Center**.
   * **Nhiệm vụ**: Theo dõi giá trung bình thị trường (`ZMARKET`) và tồn kho (`ZMB52`). Mã nào tồn kho giảm nhanh hoặc đứt hàng $\to$ Tăng giá ngay trong `VK32`. Mã nào tồn kho ứ đọng > 25,000 hộp $\to$ Giảm giá nhẹ ở `DC10`/`DC12` để xả hàng.
3. **Vị trí 3 — Giám đốc Marketing & Thị Hiếu Vùng (Regional Marketing Manager)**:
   * **Màn hình phụ trách**: `ZVC2`, `ZADS` + **Tab 3 của Web Command Center**.
   * **Nhiệm vụ**: Tìm ra vùng `North`, `South`, `West` thích hương vị nào nhất qua `ZVC2`. Chỉ bơm tiền quảng cáo `ZADS` cho đúng 1–2 sản phẩm chủ lực ở mỗi vùng; nhớ **tắt toàn bộ `ZADS` về `0` ở 3–4 ngày cuối cùng của Round cuối**.
4. **Vị trí 4 — Giám đốc Tài Chính & Định Giá (CFO & Valuation Optimizer)**:
   * **Màn hình phụ trách**: `F.01`, `FB50`, `ZLOAN`/`ZFF7B` + **Tab 1 & Tab 4 của Web Command Center**.
   * **Nhiệm vụ**: Đầu tư `€250,000 – €500,000` vào TK `478000` ngay đầu game qua `FB50`; canh chỉ số `Debt Loading >= 0` ở cuối game để khóa chặt hạng tín dụng **`AAA+`**.

---

## PHẦN 4: CÁCH XỬ LÝ 5 SỰ CỐ KINH ĐIỂN TRONG TRẬN ĐẤU

1. **"Tại sao tôi đã chạy `CO41` mà nhà máy không sản xuất ra hộp nào?"**
   * **Nguyên nhân**: Thiếu ít nhất 1 nguyên vật liệu cấu thành trong BOM (thường là do nguyên vật liệu vừa đặt ở `ME59N` đang trên đường vận chuyển chưa tới ngày giao hàng, hoặc quên chạy `ME59N`).
   * **Cách cứu**: Mở `ZMB52` xem nguyên vật liệu nào đang bằng `0`, mở `ZME2N` xem ngày mấy nó về. Trong lúc chờ, nếu trong kho đang có sẵn nguyên vật liệu của một mã sản phẩm khác thì đẩy lệnh sản xuất mã đó lên chạy trước!
2. **"Tại sao tôi có hàng tồn kho đầy trong `ZMB52` mà không bán được hộp nào?"**
   * **Nguyên nhân 1**: Giá bán trong `VK32` đang để cao vượt ngưỡng **Giá trần chịu đựng (Choke Price)** của khách hàng.
   * **Nguyên nhân 2**: Bạn sản xuất hộp **1kg (`F1x`)** nhưng chỉ giảm giá ở kênh `DC14` (kênh `DC14` chỉ mua hộp `500g`!), hoặc sản xuất hộp **500g (`F0x`)** nhưng lại giảm giá ở kênh `DC10` (kênh `DC10` chỉ mua hộp `1kg`!).
3. **"Tại sao báo lỗi `Material/Data is locked by user...`?"**
   * **Nguyên nhân**: Một thành viên khác trong đội đang mở cùng màn hình sửa dữ liệu đó (`VK32`, `MD61`, hoặc `ZCS02`).
   * **Cách khắc phục**: Quy định rõ mỗi T-code chỉnh sửa chỉ do đúng 1 người mở; sửa xong bấm `Ctrl + S` rồi bấm `F3` thoát ra màn hình chờ ngay.
4. **"Tại sao Lợi nhuận (`Current Profit`) của đội tôi cao hơn đối thủ nhưng Định giá Công ty (`Company Valuation`) lại xếp dưới họ?"**
   * **Nguyên nhân**: Đối thủ có hạng tín dụng **`AAA+`** (mẫu số chiết khấu `10%`, nhân `10x` lợi nhuận), còn đội bạn đang ôm quá nhiều tồn kho và nợ phải trả (`Accounts Payable` + `Bank Loans`) nên rơi xuống hạng **`BBB` hoặc `A`** (mẫu số chiết khấu `12%–13%`, chỉ nhân `7.7x–8.3x` lợi nhuận).
   * **Cách lật kèo**: Ở 5 ngày cuối game, dừng chạy `MD01`/`ME59N`, xả tồn kho thành tiền mặt để đưa `Debt Loading >= 0` (lên `AAA+`).


---

# PHẦN 5: PHÂN TÍCH CHUYÊN SÂU 2 TÀI LIỆU MỚI NHẤT — ERPSIM LOGISTICS SUSTAINABILITY (PRESET 3 - DAIRY) & 8 RANDOM DISRUPTORS

Từ 2 tài liệu bạn cung cấp (**ERPsim Logistics Sustainability Disruptors Guide Rev 2.0** và **Slide/Job Aid Logistics Sustainability Preset 3** cập nhật mới nhất), đây là kịch bản **Phân phối & Logistics Bền vững ngành Sữa (Dairy)** có tích hợp **8 Sự kiện Xúc xắc Ngẫu nhiên (Random Disruptors)** và **Thuế Carbon lũy tiến**.

---

## 5.1. Quy Trình 6 Bước & Nút Bấm Chuẩn Của Bản Logistics Sustainability (Preset 3)

Khác với bản Sản xuất Muesli (có `CO41` và `ZADS`), bản **Logistics Sustainability (Preset 3)** tập trung vào **Tối ưu hóa Mua hàng từ 2 Nhà cung cấp (`ZME12`: `V04` vs `V08`)**, **Điều phối Chuyển kho từ Kho tổng `03` về 3 Kho vùng `03N`, `03S`, `03W` (`ZMB1B`)**, **Kiểm soát trần sức chứa kho `4,000 units`** và **Định giá bán lẻ trên Kênh `DC 16` (`VK32`)**:

```
[1. MD61] ──> [2. MD01] ──> [3. ZME12] ──> [4. ME59N] ──> [5. ZMB1B] ──> [6. VK32]
 Dự báo        Chạy MRP      Chọn NCC       Phát hành      Chuyển kho     Sửa giá bán
 nhóm $$-T     (Enter x3)    V04 hoặc V08   Đơn mua PO     03 -> 03N/S/W  trên Kênh 16
```

### Chi tiết từng bước bấm nút trên Job Aid (Preset 3):
1. **`MD61` (Forecast Sales)**:
   * Tích chọn **`Product group`** và nhập **`$$-T`** *(Lưu ý: Nhóm sản phẩm sữa là `$$-T`, gồm 6 mã từ `$$-T01` đến `$$-T06`)* $\to$ Bấm **`Continue` (`Enter`)**.
   * Nhập số lượng dự báo mua hàng vào **cột ngày thứ 2 (2nd date column)** $\to$ Bấm **`Save`**.
2. **`MD01` (Calculate Requirements - MRP Run)**:
   * Bấm **`Enter`** và nhấp **`Execute`**.
   * Bỏ qua cảnh báo màu cam, bấm **`Enter` thêm 2 lần nữa** $\to$ Tại cửa sổ pop-up bấm **`Continue`**.
3. **`ZME12` (Select Vendor - Procurement Sourcing)**:
   * Nhấp vào nút **`Assign Source of Supply`**.
   * Với từng sản phẩm (`T01`..`T06`), chọn nhà cung cấp **`V04` (Dairy Cooperative)** hoặc **`V08` (Nordik Dairy Company)** $\to$ Bấm **`Save`**.
4. **`ME59N` (Order Materials - Create Purchase Orders)**:
   * Đảm bảo ô **`Fixed Vendor` để trống** (và bỏ tích `Test Run`).
   * Bấm **`Execute` (`F8`)** để tạo PO chính thức.
5. **`ZMB1B` (Plan Stock Transfer - Điều chuyển hàng từ Kho tổng `03` sang 3 Kho vùng `03N`, `03S`, `03W`)**:
   * Tại mục *Planning Mode*: Chọn chiến lược **`Push`** (đẩy hàng theo tỷ lệ/số lượng từ kho tổng) hoặc **`Pull`** (bơm bù theo định mức tồn kho mục tiêu tại kho vùng).
   * Tại mục *Scheduling*: Nhập tần suất chuyển kho (**Delivery frequency**, ví dụ mỗi `2` hoặc `3` ngày/lần).
   * Tại mục *Direct Sales*: Tích hoặc bỏ tích ô **`Use 03`** (Cho phép hoặc Cấm bán trực tiếp từ kho tổng `03`) và nhập `Min Qty`.
   * Nhập số lượng từng mặt hàng muốn chuyển sang **`North (03N)`**, **`South (03S)`**, **`West (03W)`** $\to$ Bấm **`Save`**.
6. **`VK32` (Maintain Prices - Kênh `DC 16`)**:
   * Mở thư mục *Prices* $\to$ Nhấp đúp **`Price List`**.
   * Kiểm tra **`Distribution Channel = 16`** (Kênh 16: Retail Stores - Quy mô thị trường ~**€72,000 / đội / ngày**, khách thanh toán sau **4 ngày**) $\to$ Bấm **`Execute`**.
   * Sửa giá bán cho 6 mặt hàng $\to$ Bấm **`Save`**.

---

## 5.2. Bảng Tham Số Gốc Của 6 Mặt Hàng Dairy, 2 Nhà Cung Cấp & Ma Trận Phí Carbon

### A. Bảng 6 Sản Phẩm Dairy (`$$-T01` đến `$$-T06`)

| Mã SKU | Tên Sản Phẩm | Tồn Kho Đầu Kỳ | Giá Mua `V04` (€) | Giá Mua `V08` (€) | Chênh Lệch Giá Gốc (`V08 - V04`) | Giá Bán Khởi Điểm (`DC 16`) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **`$$-T01`** | **Milk (Sữa tươi)** | 950 units | **€22.95** | €24.10 | V04 rẻ hơn **€1.15/unit** | **€25.25** |
| **`$$-T02`** | **Cream (Kem sữa)** | 300 units | **€72.07** | €75.67 | V04 rẻ hơn **€3.60/unit** | **€79.78** |
| **`$$-T03`** | **Yoghurt (Sữa chua)** | 700 units | **€25.85** | €27.14 | V04 rẻ hơn **€1.29/unit** | **€28.43** |
| **`$$-T04`** | **Cheese (Phô mai)** | 350 units | **€82.68** | €86.81 | V04 rẻ hơn **€4.13/unit** | **€90.95** |
| **`$$-T05`** | **Butter (Bơ)** | 400 units | **€59.88** | €62.87 | V04 rẻ hơn **€2.99/unit** | **€65.87** |
| **`$$-T06`** | **Ice Cream (Kem lạnh)** | 300 units | **€43.15** | €45.31 | V04 rẻ hơn **€2.16/unit** | **€47.47** |

### B. So Sánh Thuật Toán 2 Nhà Cung Cấp (`V04` vs `V08`)
* **Nhà cung cấp `V04` (Dairy Cooperative)**:
  * **Giá đơn vị**: Rẻ hơn `V08` ở cả 6 sản phẩm (rẻ hơn từ €1.15 đến €4.13/unit).
  * **Thời gian giao hàng (Lead time)**: **1 – 2 ngày** (Rất nhanh và ổn định).
  * **Phí vận chuyển mỗi đơn PO**: **€1,000 / PO** | Phát thải mỗi PO: **100 kg $CO_2e$ / PO** (Thấp hơn V08 300 kg/PO).
  * **Phát thải trên mỗi đơn vị hàng (Unit Carbon)**: **1.2 kg $CO_2e$ / unit**.
  * **Hạn thanh toán (Payment terms)**: 5 ngày.
* **Nhà cung cấp `V08` (Nordik Dairy Company)**:
  * **Giá đơn vị**: Đắt hơn `V04` ở cả 6 sản phẩm.
  * **Thời gian giao hàng (Lead time)**: **1 – 4 ngày** (Chậm và rủi ro đứt hàng cao hơn).
  * **Phí vận chuyển mỗi đơn PO**: **€600 / PO** | Phát thải mỗi PO: **400 kg $CO_2e$ / PO**.
  * **Phát thải trên mỗi đơn vị hàng (Unit Carbon)**: **0.8 kg $CO_2e$ / unit** (Thấp hơn V04 0.4 kg/unit).
  * **Hạn thanh toán**: 10 ngày.

> 💡 **Định lý Toán học Chọn Nhà Cung Cấp (`ZME12`)**:
> Chênh lệch phát thải trên mỗi sản phẩm giữa `V04` và `V08` chỉ là $1.2 - 0.8 = 0.4\text{ kg } CO_2e/\text{unit}$. Ngay cả khi thuế Carbon tăng lên `€0.30/kg`, phần thuế Carbon `V04` chịu thêm chỉ là $0.4 \times 0.30 = €0.12/\text{unit}$ — quá nhỏ so với số tiền tiết kiệm được từ giá mua gốc của `V04` (từ **€1.15 đến €4.13/unit**)!
> Do đó: **Nếu đặt cỡ lô mỗi PO từ 350 units trở lên, `V04` RẺ HƠN TUYỆT ĐỐI VÀ GIAO NHANH GẤP ĐÔI `V08` ở cả 6 mặt hàng!** Bạn chỉ chuyển sang `V08` khi giảng viên quay xúc xắc trúng **Event 3 (Supplier Disruption) đánh vào `V04`**!

### C. Ba Quy Tắc Sống Còn Về Kho Bãi & Vận Chuyển (`ZMB1B`)
1. **Tuyệt đối tránh bán trực tiếp từ Kho tổng `03` (Direct Sales Trap)**:
   * Nếu để khách mua trực tiếp từ Kho tổng `03`: Mỗi đơn hàng (Sales Order) bị trừ **€350 phí ship + 300 kg $CO_2e$**.
   * Nếu chuyển hàng từ Kho tổng `03` sang 3 Kho vùng (`03N`, `03S`, `03W`) qua `ZMB1B`: Mỗi lần chuyển cả lô lớn chỉ tốn **€100 + 50 kg $CO_2e$**, và khi khách mua từ Kho vùng thì **Phí ship = €0 (Miễn phí 100%)** và phát thải chỉ là **75 kg $CO_2e$ / đơn**!
   * **Thao tác chuẩn**: Ngay khi hàng đã được đẩy ra 3 kho vùng (`03N`, `03S`, `03W`), vào `ZMB1B` **BỎ DẤU TÍCH `Use 03`** để cấm bán trực tiếp từ kho tổng!
2. **Giữ Tổng Tồn Kho 4 Kho $\le 4,000\text{ Units}$**:
   * Trần kho miễn phí là **4,000 units** (cộng gộp cả `03` + `03N` + `03S` + `03W`).
   * Mỗi 1,000 units vượt trần bị phạt **€300/ngày + 500 kg $CO_2e$/ngày**!
3. **Thuế Carbon Lũy Tiến**:
   * Khởi điểm ở Round 1 là **€0.10 / kg $CO_2e$**, và sau mỗi Round tăng thêm **+€0.05 / kg $CO_2e$** (chưa kể các sự kiện xúc xắc).

---

## 5.3. Giải Mã Toàn Bộ 8 Sự Kiện Xúc Xắc (8 Random Disruptors) & Chiến Thuật Phản Công

Trong file `.pptm` của giảng viên có tích hợp Macro VBA quay xúc xắc ngẫu nhiên trước mỗi Round. Các sự kiện **có tính cộng dồn (cumulative)** cho đến hết trận và không lặp lại:

| Sự Kiện (Disruptor) | Thông Số Bị Thay Đổi Trong Hệ Thống SAP (`ZCONTROL` / `ZSTART`) | Chiến Thuật Phản Công Tức Thì Để Thắng Đối Thủ |
| :--- | :--- | :--- |
| **Event 1: Cold Spell** *(Đợt Giá Rét)* | • Quay xúc xắc chọn 1 trong 6 cặp sản phẩm: **(1) Milk & Cream**, **(2) Milk & Yoghurt**, **(3) Milk & Butter**, **(4) Cream & Yoghurt**, **(5) Cream & Butter**, **(6) Yoghurt & Butter**.<br>• Cặp sản phẩm trúng xúc xắc bị cộng **+5.0 kg $CO_2e$/unit** ở cả V04 và V08.<br>• Phạt Carbon vượt kho giảm sâu **-300 kg/container** (từ 500 xuống còn **200 kg**).<br>• Carbon năng lượng giảm **-25 kg/ngày** (còn 75 kg/ngày). | 1. Bật công tắc **Cold Spell** trên Tab đầu tiên của Web Command Center và chọn đúng cặp sản phẩm vừa quay trúng.<br>2. Vào `VK32` **tăng ngay giá bán** của 2 mặt hàng bị dính Cold Spell thêm $5 \times \text{Thuế Carbon} \times 1.35$ để đẩy toàn bộ thuế Carbon tăng thêm sang cho khách hàng.<br>3. Tận dụng việc phạt Carbon vượt kho giảm 60% để đặt lô PO lớn hơn nhằm giảm số lần chịu phí PO cố định (€1,000/PO). |
| **Event 2: Carbon Decree** *(Sắc Lệnh Thuế Carbon)* | • Thuế suất Carbon tăng đột biến **+€0.20 / kg $CO_2e$**.<br>• Carbon năng lượng mua ngoài giảm **-50 kg/ngày** (từ 100 xuống 50 kg/ngày). | 1. Kiểm tra ngay `ZMB1B`: Đảm bảo đã **bỏ tích `Use 03`** (vì 300 kg $CO_2e$ mỗi đơn bán từ kho tổng lúc này làm bốc hơi thêm €60 tiền thuế mỗi đơn!).<br>2. Giảm tần suất chuyển kho `ZMB1B` xuống (ví dụ từ mỗi 1 ngày sang mỗi 2–3 ngày/lần với lượng hàng lớn hơn).<br>3. Tăng nhẹ giá bán `VK32` đồng loạt thêm €0.40 – €0.80/unit để bù thuế Carbon. |
| **Event 3: Supplier Disruption** *(Đứt Gãy Nhà Cung Cấp)* | • Quay xúc xắc chọn **`1 = V04`** hoặc **`2 = V08`**.<br>• Nhà cung cấp bị trúng xúc xắc bị phạt thêm **+2.50 kg $CO_2e$/unit** và **+200 kg $CO_2e$/PO**. | • Nếu trúng **`V08`**: Bạn hoàn toàn miễn nhiễm vì bạn đang mua 100% từ **`V04`**!<br>• Nếu trúng **`V04`**: Tích chọn *Event 3 (V04)* trên Web Command Center. Nếu thuế Carbon đang ở mức thấp ($\le €0.25/kg$), `V04` vẫn rẻ hơn `V08` ở Cheese, Butter, Ice Cream! Nếu thuế Carbon cao ($\ge €0.35/kg$), vào `ZME12` chuyển Milk (`T01`), Cream (`T02`), Yoghurt (`T03`) sang `V08`. |
| **Event 4: Hub Gridlock** *(Tắc Nghẽn Kho Tổng 03)* | • Bán trực tiếp từ Kho tổng `03`: **+300 kg $CO_2e$/Sales Order** (Tổng lên tới **600 kg/đơn**!).<br>• Chuyển kho nội bộ (`ZMB1B`): **+100 kg $CO_2e$/transfer** (Tổng **150 kg/lần chuyển**).<br>• Mua hàng PO: **+100 kg $CO_2e$/PO**. | 1. **Tuyệt đối cấm bán từ Kho tổng `03`** (`Use 03` = Unchecked trong `ZMB1B`). Đội nào quên tắt `Use 03` ở vòng này sẽ phá sản vì 600 kg $CO_2e$ + €350 phí ship mỗi đơn!<br>2. Giãn chu kỳ chuyển kho `ZMB1B` (Delivery Frequency) ra 3 ngày/lần để giảm số chuyến xe chuyển kho. |
| **Event 5: System Glitch** *(Lỗi Khóa Báo Cáo)* | • Quay xúc xắc từ 1–6 làm khóa ngẫu nhiên nhóm báo cáo: **(1) Inventory (`ZMB52`)**, **(2) Sales (`ZVA05`, `ZVC2`)**, **(3) Procurement (`ZME2N`)**, **(4) Inv+Sales**, **(5) Inv+Proc**, **(6) Sales+Proc**.<br>• Phí thuê chuyên gia mở khóa trong T-code **`ZITM`**: **€5,000 / báo cáo**. | • Nếu bạn đang kết nối **OData (`ZODATA`)** hoặc xem qua dashboard ngoài: **Không tốn một xu nào**, vì dữ liệu OData vẫn chảy bình thường!<br>• Nếu không dùng OData và bị khóa `ZMB52`: Vào ngay T-code **`ZITM`** bỏ **€5,000** mở khóa riêng `ZMB52` (chi phí €5,000 chỉ bằng 7% doanh thu 1 ngày, rẻ hơn rất nhiều so với việc mù tồn kho). |
| **Event 6: Data Breach** *(Rò Rỉ OData Toàn Ngành)* | • Toàn bộ các đội đều truy cập được dữ liệu **OData của tất cả các đối thủ** trong phòng thi! | • Mở ngay bảng OData `Current_Inventory` và `Sales` của các đội khác: Xem mặt hàng nào (`T01`..`T06`) tại vùng nào (`North`, `South`, `West`) các đối thủ đang bị **Tồn kho = 0 (Stockout)**.<br>• Ngay lập tức dùng `ZMB1B` đẩy mặt hàng đó vào vùng bị trống và vào `VK32` nâng giá bán mặt hàng đó lên **+10% đến +15%** để độc chiếm thị trường! |
| **Event 7: Flash Flood** *(Lũ Quét Mất Trắng 1 Kho)* | • Quay xúc xắc từ 1–4 xóa sạch 100% tồn kho của 1 kho: **(1) Central (`03`)**, **(2) North (`03N`)**, **(3) South (`03S`)**, **(4) West (`03W`)**. | • **Nếu lũ quét trúng Kho vùng (`03N`, `03S` hoặc `03W`)**: Hàng ở kho tổng `03` vẫn còn nguyên $\to$ Vào `ZMB1B` tăng lượng chuyển hàng khẩn cấp về kho vùng vừa mất trắng.<br>• **Nếu lũ quét trúng Kho tổng (`03`)**: Hàng ở 3 kho vùng vẫn đang bán bình thường! Lập tức vào `MD61` $\to$ `MD01` $\to$ Đảm bảo `ZME12` đang chọn **`V04` (vì V04 giao hàng chỉ mất 1–2 ngày!)** $\to$ Chạy `ME59N` để 1–2 ngày sau kho tổng đầy hàng trở lại! |
| **Event 8: AI Innovation** *(Mở Khóa Công Cụ AI `ZRPA`)* | • Giảng viên kích hoạt trong `ZSTART`, mở khóa T-code **`ZRPA`** (*AI-Powered Application: AI Requirements Planning `MD61` & AI Price Management `VK32`*). | • Mở **`ZRPA`** để tham khảo hoặc tự động điền nhanh dự báo nhu cầu mua hàng (`MD61`) giúp tiết kiệm thời gian thao tác tay.<br>• Tuy nhiên, với giá bán `VK32`, hãy đối chiếu với cột **GIÁ BÁN TỐI ƯU VK32 (DC 16)** trên Tab đầu tiên của Web Command Center để đảm bảo biên lợi nhuận đã tính đủ phần trượt giá Thuế Carbon của các Disruptors trước đó! |
