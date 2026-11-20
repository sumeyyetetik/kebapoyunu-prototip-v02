# Döner Ready! 3D — Oyun Mimarisi, Pizza Ready! Referans Sistemi & Orijinal Türk Döner Kurgusu

Bu dosya, Antigravity (AGY) özelleştirme sistemi tarafından her geliştirme adımında otomatik olarak okunur. Oyunun temel mekanik iskeleti **Pizza Ready! (Supercent)** arcade-idle standardını referans alırken, içerik, kültür, tedarik zinciri ve özel etkinlikler tamamen **kullanıcının orijinal Türk Döner Salonu vizyonuna** aittir.

---

## 1. Pizza Ready! Referans Mekanik İskeleti (Core Loop & Denge Kuralları)

1. **Kamera & Diorama Perspektifi:**
   - Tam 2D ortografik değil; derinlik hissi veren 3D Perspektif Kamera (`FOV: 46°–48°`).
   - Oyuncu (Usta) ekranın alt-orta bölgesinde yumuşak takip (`Smooth Follow`) ile tutulur; böylece üstteki ocaklar, kasa bankoları, masalar ve arka plandaki İstanbul Boğazı net görünür.

2. **Kademeli Seviye & Alan Açma (Unlock Pad Progression):**
   - Yeni masalar, ocaklar ve satış kanalları (Salon -> İK/HR -> Ayran -> Paket Servis & Semaver -> Zurna Dürüm -> Drive-Thru -> Şalgam & Kapan -> İskender & VIP Masa -> Altın Semaver) yeşil zemin alanlarına (`unlockPads`) basılarak 3.5 saniyelik akıcı nakit akışıyla açılır.
   - Hiçbir tekil etkinlik (ör. Gizli Milyoner bahşişi veya çevrimdışı kazanç) tek seferde doğrudan seviye atlatacak kadar aşırı para veya XP vermemelidir (milyoner ödülü mevcut seviye hedefinin ~%22–25'i ile sınırlandırılır).

3. **HR (İnsan Kaynakları) & Oyuncu Yükseltme Eğrisi (8 Kademeli Sistem):**
   - **Usta (Oyuncu) Yükseltmeleri:** Yürüme Hızı (`120 -> 186`), Tepsi Kapasitesi (`3 -> 15`), Döner Kesim/Üretim Hızı (`1.00x -> 2.15x`).
   - **Garson & Güvenlik (HR) Yükseltmeleri:** Garson Sayısı (`0 -> 5`), Garson Hızı (`84 -> 152`), Garson Kapasitesi (`2 -> 12`), Bıyıklı Bekçi ve Otomatik Drive-Thru Kapanı.
   - **Seviye Kilidi (`getMaxAllowedUpgradeStar`):** Erken seviyelerde tüm istatistiklerin fullenmesini önlemek için yükseltme yıldızları dükkan seviyesiyle (`state.levelIndex`) orantılı açılır.

4. **Aktif Oynanış vs. Çevrimdışı (Idle) Pasif Satış Dengesi:**
   - **Oyuncu Oyundayken:** Yapay/otomatik "Pasif Satış" veya kendi kendine kasaya para aktarımı (`KASA` / `PASİF SATIŞ`) **olmaz**. Oyuncu oyundayken otomasyon yalnızca oyuncunun HR'dan işe aldığı **Garsonlar (ürün taşıma, masa/WC temizliği), Bıyıklı Bekçi ve Otomatik Kapan** üzerinden fiziksel olarak işler; paraları toplamak, hammadde yenilemek ve dükkanı yönetmek oyuncudadır.
   - **Oyuncu Oyunda Değilken (Çevrimdışı / Arka Plan Pasif Satış — ~20%–25% Hız):** Pasif satış yalnızca oyuncu oyunda değilken (`localStorage` zaman damgası ile, sekme kapalıyken veya arka plandayken) devreye girer. Aktif oynayış her zaman çok daha fazla kazandırır; çevrimdışı kazançtan %20 hammadde tedarik gideri düşülerek dengeli bir net kâr kasaya eklenir.

5. **Katı Çarpışma (Collision) & Takılmasız Navigasyon Kuralları:**
   - **Hiçbir Karakterin İçinden Geçilmez:** Usta, müşteriler, garsonlar, dışarıdaki yayalar ve 5 mahalle kedisi birbirinin, duvarların, masaların (`hw: 30, hh: 24`), bankoların (`hw: 24, hh: 40`) veya ocakların (`hw: 24, hh: 20`) içinden asla geçemez.
   - **Belirli Etkileşim Noktaları (Action Pads):** Kesim, ürün alma, bankoya ürün bırakma, para toplama ve masa/WC temizliği yalnızca ilgili istasyonun önündeki zemin halkası (`padX, padY`) üzerinden yapılır.

---

## 2. Orijinal "Döner Ready! 3D" Mekanikleri (Korunması Zorunlu Özgün Kurgular)

1. **Hammadde Tedarik Kamyonları & Net Kâr Ekonomisi:**
   - Tavuk eti (`rawMeat`, 10 adetlik kasa = `20 ₺`, birim maliyet `2 ₺`) ve İçecek (`rawDrink`, 15 adetlik kasa = `15 ₺`, birim maliyet `1 ₺`) ayrı zamanlarda biter.
   - Sol cephedeki iki şeritli tedarik yolunda Tavuk Kamyonu (`x = -23.2`) ve İçecek Kamyonu (`x = -29.0`) duvarlara değmeden tek yönlü (`+Y -> -Y`) yanaşır.
   - Hammadde yenilerken oyuncu ped üzerinde süre barının dolmasını bekler (`3.0sn` / `2.6sn`), alınan hammadde bedeli **kazanılan paradan eksilir** (`💸 -20 ₺` / `💸 -15 ₺`) ve gün sonu Z-Raporu'na gider olarak işlenir.

2. **Ürüne Özel Servis Bölmeleri & Orantılı Siparişler:**
   - Ekmek Arası Tavuk Döner (`doner`), Zurna Tavuk Dürüm (`durum`), Bakır Sahanda İskender (`iskender`), Tombul Ayran (`ayran`) ve Şalgam (`salgam`) banko üzerinde **ayrı tepsilerde (`cnt.stacks[itemKey]`)** tutulur.
   - Müşteri ne istediyse yalnızca kendi istediği ürünü alır; açık olan tüm yemek ve içecek çeşitleri dengeli/orantılı şekilde sipariş edilir.

3. **Tuvalet (WC) Peçete Temizliği & 80° Limon Kolonyası:**
   - WC tek kişiliktir; içeride müşteri varken veya WC kirliyken (`restroom.dirty`) başka müşteri içeri girmez.
   - 3 kullanımdan sonra yerde 3D buruşuk peçeteler (`wc_trash`) oluşur; Usta veya Garson bunları tek tek toplayıp çöpe atarak temizler.
   - WC'den çıkan müşteri önce kapıdan düz çıkar (`exiting_wc_door`), ardından yandaki limon etiketli kolonya standından (`using_cologne`) limon kolonyası dökünüp çıkışa yönelir.

4. **Sosyal & Sürpriz NPC Olayları:**
   - **Kaynak Yapan Müşteri (`lineCutterNPC`):** Salon veya Paket Servis sırasının önüne kaynak yapar. Usta/Bekçi yanına gidip 3 saniye kibarca konuşarak ikna eder (tokat atılmaz); kaynakçı sıranın **en arkasına** geçip normal müşteri olur.
   - **Dilenci / Gizli Milyoner (`millionaire`):** %70 ihtimalle gerçek ihtiyaç sahibidir (sadece hayır duası ve teşekkür eder, para vermez); %30 ihtimalle kılık değiştirmiş milyonerdir (sihirli altın elmas girdabıyla dönüşüp dengeli bir ödül bırakır).
   - **Maskeli Hırsız (`thiefNPC`) & Polis Arabası:** Yakalanınca Osmanlı tokadı (`slap`) yer, kapıya koşar, dışarıda `-X` yönünde gelen polis arabasından inen 2 polis tarafından elleri arkadan kelepçelenip (`being_handcuffed`) arabaya bindirilerek (`shoving_into_car`) götürülür.

5. **İstanbul Boğazı Gün Döngüsü (08:00 – 22:00) & Z-Raporu:**
   - Arka planda İstanbul Boğazı, Boğaz Köprüsü, Kız Kulesi, Şehir Hatları Vapuru ve uçuşan martılar yer alır.
   - Güneş ve Dolunay, Boğaz Köprüsü'nün **arkasında** (`z = -78`) doğudan (`+X`) batıya (`-X`) doğal bir gökyüzü yayı çizerek hareket eder. Saat 22:00'de dükkan kapanır ve Gün Sonu Z-Raporu açılır.
