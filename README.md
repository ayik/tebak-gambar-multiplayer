# Tebak Gambar Multiplayer

Game multiplayer tebak gambar, buka kotak, tebak nama orang!

## Deploy

### Backend (Railway/Render/Docker)
- Deploy folder `/backend` (Dockerfile, npm install, node index.js).
- Port default: 4000. Folder `uploads` wajib writable.

### Frontend (Netlify/Vercel)
- Build: `npm run build`
- Deploy hasil build ke Netlify/Vercel/upload manual folder `dist/`.
- Edit `.env.production`:
    ```
    VITE_BACKEND_URL=https://your-backend-domain.com
    ```
- **Netlify:** Tambah file `public/_redirects` untuk proxy `/api` dan `/uploads` ke backend.

### Connection
- Gambar & API harus lewat backend (CORS aktif).
- Socket.IO gunakan: `io(import.meta.env.VITE_BACKEND_URL)`.

---

## Cara Jalankan Lokal

**Backend:**
```bash
cd backend
npm install
node index.js
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```