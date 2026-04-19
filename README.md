# AI News Portal 🚀

AI News Portal, en güncel teknoloji, ekonomi ve dünya haberlerini tek bir noktada toplayan, tamamen frontend tabanlı (veritabanı veya backend sunucusu gerektirmeyen) modern bir haber okuma platformudur. 

Uygulama, haberleri çekerken yapay zeka tarafından özetlenmiş hissiyatı veren özel bir UI tasarımıyla ve "Glassmorphism" (cam efekti) konseptiyle geliştirilmiştir.

## ✨ Özellikler

- **Çoklu Veri Kaynağı:** Teknoloji (Webrazzi), Ekonomi (Bloomberg HT) ve Dünya (Euronews) haberlerini eşzamanlı olarak çeker.
- **Backend Gerektirmez:** Haberler `rss2json` API kullanılarak asenkron olarak doğrudan tarayıcı üzerinden getirilir.
- **Modern Arayüz:** Tailwind CSS kullanılarak geliştirilmiş, tamamen responsive (mobil ve tablet uyumlu) tasarım.
- **Karanlık Tema (Dark Mode):** Göz yormayan ve sistem tercihinizi/seçiminizi hatırlayan şık bir karanlık tema desteği.
- **AI Summary Konsepti:** Her habere özel, dikkat çekici ve estetik bir "✨ AI Özet" rozeti.
- **Kategori Filtreleme:** Haberler arasında hızlı geçiş yapabilmeniz için kategorilere özel filtreleme sistemi.

## 🛠 Kullanılan Teknolojiler

- **HTML5 & Vanilla JavaScript** (Esnek ve hızlı)
- **Tailwind CSS (CDN)** (Hızlı stillendirme ve modern tasarımlar için)
- **rss2json API** (XML/RSS beslemelerini JSON formatına çevirmek için)
- **FontAwesome & Google Fonts** (Tipografi ve ikonlar için)

## 🚀 Nasıl Çalıştırılır?

Bu projenin çalışması için bilgisayarınızda herhangi bir ek yazılıma (Node.js, npm, veritabanı vb.) ihtiyacınız yoktur.

1. Proje dosyalarını bilgisayarınıza indirin veya klonlayın.
2. Klasör içerisindeki `index.html` dosyasına çift tıklayarak varsayılan tarayıcınızda açın.
3. Uygulama otomatik olarak internete bağlanıp güncel haberleri çekecektir.

## 📁 Dosya Yapısı

- `index.html`: Uygulamanın iskeleti, Tailwind kütüphanesi ve UI yapısı.
- `app.js`: Veri çekme (fetch), hata yönetimi, filtreleme ve karanlık tema işlevlerini barındıran asıl uygulama mantığı.
- `styles.css`: Tailwind'in CDN versiyonuyla kolayca yapılamayan özel animasyonlar, hover efektleri ve cam (glassmorphism) tasarımlarını içeren dosya.
