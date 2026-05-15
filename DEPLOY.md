# Deployment Strategy (SumoPod PaaS)

Berdasarkan permintaan Anda untuk menggunakan **SumoPod** (Platform as a Service lokal Indonesia yang berbasis kontainer), kita akan menggunakan pendekatan **Docker Container**. 

SumoPod sangat memudahkan *deployment* karena Anda hanya perlu mengunggah *image* Docker atau menyambungkannya ke *repository* GitHub Anda, dan SumoPod akan menangani infrastruktur servernya.

## Arsitektur Deployment (Single Container)
Karena aplikasi kita adalah *monorepo* yang terdiri dari Frontend (Web), Backend API, dan Background Worker, pendekatan paling efisien di SumoPod untuk menekan biaya adalah menggabungkannya dalam **Satu Container (Single Container)** menggunakan **PM2** sebagai *process manager* di dalam Docker.

- **Port yang diekspos**: `3000` (Web Next.js) dan `3001` (API NestJS).
- **Database & Auth**: Tetap menggunakan **Supabase**.
- **Redis Queue**: Tetap menggunakan **Upstash Redis** (Atau bisa menginstal Redis via SumoPod Marketplace jika Anda ingin *self-host*).

---

## Langkah Deployment di SumoPod

### 1. Persiapan File Konfigurasi
Sistem ini sudah dilengkapi dengan 2 file khusus untuk SumoPod:
- `Dockerfile`: Berisi instruksi instalasi Node.js, Python (untuk agen Scrapling), instalasi paket, dan proses *build*.
- `ecosystem.config.js`: File PM2 untuk menjalankan 3 servis (Web, API, Worker) secara paralel di dalam satu kontainer SumoPod.

### 2. Konfigurasi Environment Variables
Di panel *dashboard* SumoPod, saat Anda membuat *service* baru, pastikan Anda memasukkan *Environment Variables* berikut:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` (URL koneksi Postgres dari Supabase)
- `REDIS_URL` (URL koneksi Redis dari Upstash)

### 3. Build & Deploy
Anda memiliki 2 opsi di SumoPod:

**Opsi A: Deploy Langsung dari GitHub (Direkomendasikan)**
1. Masuk ke dasbor SumoPod.
2. Buat App baru, hubungkan ke akun GitHub Anda.
3. Pilih repositori proyek ini.
4. SumoPod akan secara otomatis mendeteksi `Dockerfile` di folder *root*.
5. Masukkan *Environment Variables*.
6. Klik **Deploy**. SumoPod akan melakukan *build* otomatis.

**Opsi B: Push Docker Image Manual**
Jika Anda ingin melakukan *build* di komputer lokal terlebih dahulu (untuk menghemat *resource build* di SumoPod):
```bash
# Build image lokal
docker build -t finetune-agent:latest .

# Tag dan Push ke Docker Registry Anda (misal: Docker Hub atau SumoPod Registry)
docker tag finetune-agent:latest <username>/finetune-agent:latest
docker push <username>/finetune-agent:latest
```
Kemudian di SumoPod, Anda tinggal melakukan *deploy* dari *Image Registry*.

### 4. Routing & Domain
Setelah kontainer menyala di SumoPod:
1. SumoPod akan memberikan URL sementara.
2. Arahkan *Custom Domain* Anda di panel SumoPod.
3. Jika SumoPod mendukung *port mapping*, petakan *port* publik (80/443) ke *port* internal `3000` kontainer. Untuk *port* API, Anda bisa mengaksesnya di *port* `3001` kontainer.

---

## Manajemen Log di SumoPod
Jika Anda ingin melihat aktivitas AI Agent atau API yang sedang berjalan, Anda bisa membuka fitur **Logs** di *dashboard* aplikasi SumoPod Anda. Log dari PM2 (gabungan Web, API, dan Worker) akan otomatis dialirkan ke antarmuka SumoPod.
