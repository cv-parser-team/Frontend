# Document Upload UI (updated)

A responsive React/Vite implementation of the supplied default and upload-queue screens.

## Stack
- React 18 + Vite
- Tailwind CSS 3
- React Router DOM (available for future routes; this is a single-page screen)
- Lucide React icons

Axios and form libraries are not included because there is no backend API and the upload workflow is implemented with native React state.

## Setup (Windows / VS Code)
```powershell
npm install
npm run dev
```
Open the local URL printed by Vite, normally http://localhost:5173.

## Production
```powershell
npm run build
npm run preview
```

## Upload interaction
1. Browse for one or multiple files or drag them into the drop area.
2. Selected files appear in the Ready to upload queue.
3. Unsupported formats, files over 10 MB, unreadable empty files, and duplicates are flagged with actions.
4. Click Upload to see a simulated progress process.
5. When it reaches 100%, successful files move into the Your sources table with a Queued status.

The upload process is frontend simulation only. Replace the timer in `src/App.jsx` with your backend upload API and processing-status polling for production. Existing sample source rows and the review banner reproduce the supplied reference state.
