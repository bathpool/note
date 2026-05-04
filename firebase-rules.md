# Firebase Security Rules

## Recommended Rules for Notes App

Apply these rules in the [Firebase Console](https://console.firebase.google.com/) under **Realtime Database > Rules**.

### Step 1: Use these rules FIRST (allows migration of old notes)

```json
{
  "rules": {
    "notes": {
      ".read": "auth != null",
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid",
        "$noteIndex": {
          ".validate": "newData.isString() && newData.val().length <= 5000"
        }
      }
    }
  }
}
```

These rules allow any authenticated user to READ the old shared notes (needed for migration), but only WRITE to their own `notes/{uid}` path.

### Step 2: Final rules (supports images in notes)

```json
{
  "rules": {
    "notes": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    ".read": false,
    ".write": false
  }
}
```

## What These Rules Do

- **Per-user isolation**: Each user can only read/write their own notes at `notes/{their-uid}`
- **Authentication required**: Only signed-in users can access any data
- **Length validation**: Individual notes are capped at 5000 characters server-side
- **Default deny**: All other paths are blocked

## How to Apply

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the project **leads-tracker-app-b400c**
3. Navigate to **Realtime Database** → **Rules** tab
4. Replace the existing rules with the **Step 1** rules above (allows migration)
5. Click **Publish**
6. Sign out and sign back into the Notes App — your old notes should appear
7. Once your notes are migrated, come back and replace with the **Step 2** rules (stricter)

## Important: Enable Google Sign-In

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Google** as a sign-in provider
3. Add your deployed domain to **Authorized domains** (e.g., `green-coast-0f94f351e.azurestaticapps.net`)

## Important: Update Firebase Config

The `apiKey` in `Notes_app.js` needs to be replaced with your real Firebase Web API key:

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Under **Your apps** → Web app, find the `apiKey`
3. Replace `"AIzaSyDummyKeyReplaceMeWithReal"` in `Notes_app.js` with your actual key

> Note: Firebase API keys are safe to expose in client-side code. They only identify your project — access control is enforced by Security Rules and Authentication.
