# Google Sheets Integration Setup Guide

This guide will help you set up Google Sheets integration for your ChronoTunes song database, allowing you to view and edit songs directly in Google Sheets.

## Prerequisites

- Google account
- Node.js and npm installed
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for later use

## Step 2: Enable Google Sheets API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

## Step 3: Create Service Account Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in the service account details:
   - Name: `chronotunes-sheets-service`
   - Description: `Service account for ChronoTunes Google Sheets integration`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 4: Generate and Download Key

1. Find your newly created service account in the credentials list
2. Click on the service account name
3. Go to the "Keys" tab
4. Click "Add Key" → "Create New Key"
5. Choose "JSON" format
6. Click "Create" - this will download a JSON file
7. **Important**: Rename this file to `credentials.json` and place it in your project root

## Step 5: Create a Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Give it a name like "ChronoTunes Song Database"
4. Copy the spreadsheet ID from the URL (the long string between `/d/` and `/edit`)
   - Example: In `https://docs.google.com/spreadsheets/d/1ABC123xyz/edit`, the ID is `1ABC123xyz`

## Step 6: Share Spreadsheet with Service Account

1. Open your spreadsheet
2. Click the "Share" button
3. Add the service account email as an editor
   - Find the email in your `credentials.json` file (it's the `client_email` field)
   - It looks like: `chronotunes-sheets-service@your-project.iam.gserviceaccount.com`
4. Make sure to give "Editor" permissions
5. Click "Share"

## Step 7: Configure Environment Variables

1. Create a `.env.local` file in your project root
2. Add your spreadsheet ID:
   ```
   GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
   ```

## Step 8: Test the Integration

Run the sync command to upload your current song database to Google Sheets:

```bash
npm run sync-to-sheets
```

If successful, you should see your song data in the Google Spreadsheet!

## Usage

### Sync from JSON to Google Sheets
```bash
npm run sync-to-sheets
```
This uploads your local `src/data/songs.json` to Google Sheets, overwriting the sheet content.

### Sync from Google Sheets to JSON
```bash
npm run sync-from-sheets
```
This downloads data from Google Sheets and updates your local `src/data/songs.json` file. A backup of the original file is created automatically.

## File Structure

After setup, your project should have:
```
chronotunes-mvp/
├── credentials.json              # Google service account credentials (DO NOT COMMIT)
├── .env.local                   # Environment variables (DO NOT COMMIT)
├── src/
│   ├── lib/
│   │   └── googleSheets.ts      # Google Sheets service class
│   └── data/
│       └── songs.json           # Your song database
└── scripts/
    ├── sync-to-sheets.ts        # Upload to Google Sheets
    └── sync-from-sheets.ts      # Download from Google Sheets
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `credentials.json`** - Add it to `.gitignore`
2. **Never commit `.env.local`** - Add it to `.gitignore`
3. The service account has editor access to your spreadsheet only
4. Limit sharing of your spreadsheet to trusted collaborators

## Troubleshooting

### Error: "Google Sheets credentials not configured"
- Ensure `credentials.json` is in your project root
- Verify the JSON file is valid and contains the service account key

### Error: "The caller does not have permission"
- Make sure you shared the spreadsheet with the service account email
- Verify the service account has "Editor" permissions

### Error: "GOOGLE_SPREADSHEET_ID not found"
- Check that `.env.local` exists in your project root
- Verify the spreadsheet ID is correct (copy from the URL)

### Error: "Unable to parse range"
- The spreadsheet might be empty or have a different sheet name
- Try creating a new spreadsheet and following the setup steps again

## Adding to .gitignore

Make sure to add these lines to your `.gitignore` file:
```
# Google Sheets Integration
credentials.json
.env.local
```

## Next Steps

Once set up, you can:
1. Edit songs directly in Google Sheets
2. Add new songs with proper formatting
3. Use Google Sheets features like sorting, filtering, and collaboration
4. Sync changes back to your application using `npm run sync-from-sheets`

The spreadsheet will have these columns:
- ID
- Title
- Artist
- Year
- Genre
- Cultural Region
- Historical Significance
- Spotify URL
- YouTube URL
- Apple Music URL