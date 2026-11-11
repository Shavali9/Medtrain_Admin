# MedTrain Admin

The staff dashboard for MedTrain, kept separate from the public website (`../Medtrain`).

```bash
npm install
npm run dev -- --port 8082   # http://localhost:8082  (redirects to /admin)
npm run build
```

## Demo mode
- Data is sample data stored in this browser (`localStorage`, key `medtrain-admin-demo-v1`). Courses, faculty and gallery start from the same content as the public site (`src/data`, `src/assets`).
- Sign-in is a role picker with no password. Roles (admin, reviewer) only change what the screens show; nothing is secured.
- Edits do **not** change the public website.

## Going live
Replace `src/admin/store.ts` (data) and `src/admin/session.ts` (sign-in) with a real backend and authentication, and enforce roles on the server. Host this app on its own address (for example `admin.med-train.com`) and keep it out of search engines (already `noindex` and `Disallow: /`).
