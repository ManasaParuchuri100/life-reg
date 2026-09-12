# Hearthbound - PixelRealm: Life RPG

An original pixel-art and 3D voxel-inspired Life RPG world where real-life daily discipline, workouts, and creative habits evolve your playable realm, unlock buildings, and level up your character.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase Credentials
The production configuration file `firebase-applet-config.json` is excluded from Git tracking for security.

To connect your own Firebase project:
1. Copy the example configuration:
   ```bash
   cp firebase-applet-config.json.example firebase-applet-config.json
   ```
2. Open `firebase-applet-config.json` and replace the placeholder fields with your Firebase project credentials from the [Firebase Console](https://console.firebase.google.com/):
   - `projectId`: Your Firebase project ID
   - `appId`: Web app ID
   - `apiKey`: Web API key
   - `authDomain`: `<project-id>.firebaseapp.com`
   - `firestoreDatabaseId`: `(default)` or custom database ID
   - `storageBucket`: `<project-id>.firebasestorage.app`

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```
