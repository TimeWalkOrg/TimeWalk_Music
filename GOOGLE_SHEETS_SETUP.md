# Google Sheets Integration Setup Guide

This guide will help you set up Google Sheets integration for the ChronoTunes song database, allowing you to view and edit songs directly in Google Sheets.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Node.js and npm installed

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Give your project a name (e.g., "ChronoTunes")
4. Note your project ID

## Step 2: Enable the Google Sheets API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"

## Step 3: Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - **Name**: ChronoTunes Sheets Access
   - **ID**: chronotunes-sheets (or similar)
   - **Description**: Service account for ChronoTunes Google Sheets integration
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 4: Generate a Service Account Key

1. In the "Credentials" page, find your service account
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" > "Create new key"
5. Select "JSON" format
6. Click "Create" - this will download a JSON file
7. **Keep this file secure!** It contains your private credentials

## Step 5: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open the downloaded JSON key file and copy the required values:
   - `client_email` → `GOOGLE_CLIENT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY`

3. Edit your `.env` file:
   ```env
   GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
   ```

   **Important**: Make sure to keep the quotes around the private key and preserve the `\n` characters.

## Step 6: Create a Google Spreadsheet

You have two options:

### Option A: Create a new spreadsheet automatically
```bash
npm run sync:create
```

This will create a new spreadsheet and give you the ID to add to your `.env` file.

### Option B: Create manually
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "ChronoTunes Song Database"
4. Copy the spreadsheet ID from the URL (the long string between `/d/` and `/edit`)
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```
5. Add it to your `.env` file:
   ```env
   GOOGLE_SHEETS_ID=your_spreadsheet_id_here
   ```

## Step 7: Share the Spreadsheet

1. Open your Google Spreadsheet
2. Click the "Share" button (top-right)
3. Add your service account email (from step 5) as an editor
4. Make sure to give "Editor" permissions
5. Click "Send"

## Step 8: Test the Connection

```bash
npm run sync:test
```

If successful, you should see:
```
Successfully connected to spreadsheet: ChronoTunes Song Database
```

## Step 9: Upload Your Song Database

```bash
npm run sync:upload
```

This will upload all 25 songs from your local `songs.json` file to Google Sheets.

## Available Commands

- `npm run sync:upload` - Upload local songs to Google Sheets
- `npm run sync:download` - Download songs from Google Sheets to local file
- `npm run sync:create` - Create a new Google Spreadsheet
- `npm run sync:compare` - Compare local and Google Sheets data
- `npm run sync:test` - Test the Google Sheets connection
- `npm run sync` - Show help and available commands

## Usage Workflow

### To Edit Songs in Google Sheets:
1. Make changes directly in the Google Spreadsheet
2. Run `npm run sync:download` to sync changes back to your local file
3. Commit the updated `songs.json` to your repository

### To Add New Songs:
1. Add songs to the Google Spreadsheet (maintain the same column structure)
2. Run `npm run sync:download` to update your local file

### Column Structure:
- **A**: ID (integer)
- **B**: Title (text)
- **C**: Artist (text)
- **D**: Year (integer)
- **E**: Genre (text)
- **F**: Cultural Region (text)
- **G**: Historical Significance (text)
- **H**: Spotify URL (optional)
- **I**: YouTube URL (optional)
- **J**: Apple Music URL (optional)

## Troubleshooting

### "Failed to connect to Google Sheets"
- Check that your service account email has access to the spreadsheet
- Verify your environment variables are correct
- Make sure the Google Sheets API is enabled

### "GOOGLE_SHEETS_ID environment variable is not set"
- Add the spreadsheet ID to your `.env` file
- Make sure you copied the correct ID from the spreadsheet URL

### "Error: Requested entity was not found"
- The spreadsheet ID might be incorrect
- The service account might not have access to the spreadsheet

### Private key errors
- Make sure the private key in `.env` includes the full key with headers
- Keep the quotes around the private key value
- Preserve `\n` characters in the key

## Security Notes

- Never commit your `.env` file to version control
- Keep your service account JSON file secure
- Only give the service account access to the specific spreadsheet it needs
- Consider using Google Cloud IAM for more granular permissions in production

## Next Steps

Once set up, you can:
- Edit songs directly in Google Sheets
- Add new songs using the same column structure
- Use `npm run sync:download` to keep your local file in sync
- Share the spreadsheet with team members for collaborative editing

The spreadsheet will be accessible at:
```
https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
```