# Google Sheets Integration Setup

This guide will help you set up Google Sheets integration for your song database so you can edit it directly in Google Sheets and sync changes back to your application.

## Quick Overview

Your Google Sheet: https://docs.google.com/spreadsheets/d/1c88b1aT_Iufmc-tztfPMPFZeUVQ8J2BTXnLbAPnWkKA/edit

## Prerequisites

1. A Google Cloud Platform account
2. Access to your Google Sheet (already created)
3. Node.js and npm installed

## Setup Steps

### 1. Google Cloud Console Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select a Project**:
   - Click on the project dropdown at the top
   - Either create a new project or select an existing one
   - Note down your project ID

3. **Enable Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

4. **Create Service Account**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Enter a name (e.g., "sheets-sync-service")
   - Click "Create and Continue"
   - Skip the optional steps and click "Done"

5. **Generate Service Account Key**:
   - Click on the newly created service account
   - Go to the "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the JSON file and save it securely

### 2. Share Google Sheet with Service Account

1. **Get Service Account Email**:
   - Open the downloaded JSON file
   - Find the `client_email` field (looks like: `your-service@project-id.iam.gserviceaccount.com`)

2. **Share the Sheet**:
   - Open your Google Sheet: https://docs.google.com/spreadsheets/d/1c88b1aT_Iufmc-tztfPMPFZeUVQ8J2BTXnLbAPnWkKA/edit
   - Click the "Share" button in the top right
   - Add the service account email
   - Give it "Editor" permissions
   - Click "Send"

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Configuration

1. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`** with one of these options:

   **Option A: Key File Path (Recommended for Local Development)**
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./path/to/your-service-account-key.json
   ```

   **Option B: Key as Environment Variable (Recommended for Production)**
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'
   ```

## Usage

### Initial Setup: Push Current Data to Google Sheets

```bash
npm run sync-to-sheets
```

This will:
- Read all songs from `src/data/songs.json`
- Clear your Google Sheet
- Add proper headers
- Upload all song data

### Sync Changes from Google Sheets

After editing in Google Sheets:

```bash
npm run sync-from-sheets
```

This will:
- Download data from Google Sheets
- Create a backup of your current JSON file
- Update `src/data/songs.json` with the new data
- Show a summary of changes

### API Endpoints (for Web Interface)

If your Next.js app is running (`npm run dev`):

- **Sync TO Sheets**: `POST /api/sync/to-sheets`
- **Sync FROM Sheets**: `POST /api/sync/from-sheets`

Example usage:
```bash
# Push to sheets
curl -X POST http://localhost:3000/api/sync/to-sheets

# Pull from sheets
curl -X POST http://localhost:3000/api/sync/from-sheets
```

## Google Sheet Structure

Your sheet should have these columns (in this order):

| Column | Field | Description |
|--------|-------|-------------|
| A | ID | Unique identifier for each song |
| B | Title | Song title |
| C | Artist | Artist name |
| D | Year | Release year |
| E | Genre | Music genre |
| F | Cultural Region | Geographic/cultural region |
| G | Historical Significance | Historical context |
| H | Spotify URL | Spotify link (optional) |
| I | YouTube URL | YouTube link (optional) |
| J | Apple Music URL | Apple Music link (optional) |

## Best Practices

1. **Always backup**: The sync scripts automatically create backups, but keep your own copies
2. **Check for duplicates**: The sync will warn you about duplicate IDs
3. **Use unique IDs**: Each song should have a unique ID number
4. **Test first**: Try with a small dataset first to ensure everything works
5. **Regular syncs**: Sync frequently to avoid conflicts

## Troubleshooting

### Authentication Errors
- Verify the service account email has been shared with your Google Sheet
- Check that the JSON key file path is correct
- Ensure the Google Sheets API is enabled in your project

### Permission Errors
- Make sure the service account has "Editor" access to the sheet
- Verify the spreadsheet ID is correct in the configuration

### Data Issues
- Check that required fields (ID, Title, Artist) are not empty
- Ensure IDs are unique numbers
- Verify the sheet structure matches the expected columns

### API Rate Limits
- Google Sheets API has rate limits
- If you hit limits, wait a few minutes before trying again
- Consider reducing the frequency of syncs for large datasets

## Support

If you encounter issues:

1. Check the console output for detailed error messages
2. Verify all setup steps were completed correctly
3. Test with a smaller dataset first
4. Check Google Cloud Console for API quota usage

## Security Notes

- **Never commit** the service account JSON file to version control
- Use environment variables for production deployments
- Regularly rotate service account keys
- Monitor access logs in Google Cloud Console