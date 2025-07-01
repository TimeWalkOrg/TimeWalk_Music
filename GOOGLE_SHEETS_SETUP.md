# Google Sheets Integration Setup Guide

This guide will help you set up Google Sheets integration for your ChronoTunes music playlist app, allowing you to edit the song database directly in Google Sheets.

## Overview

The integration provides two approaches:
1. **Google Sheets as Primary Database** - Read songs directly from Google Sheets
2. **Bidirectional Sync** - Synchronize between your local JSON file and Google Sheets

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to **APIs & Services** > **Library**
   - Search for "Google Sheets API"
   - Click on it and press **Enable**

## Step 2: Create a Service Account

1. In Google Cloud Console, go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Fill in the details:
   - **Service account name**: `chronotunes-sheets-service`
   - **Description**: `Service account for ChronoTunes Google Sheets integration`
4. Click **Create and Continue**
5. Skip the optional steps and click **Done**

## Step 3: Generate Service Account Key

1. Find your newly created service account in the list
2. Click on the service account email
3. Go to the **Keys** tab
4. Click **Add Key** > **Create new key**
5. Choose **JSON** format and click **Create**
6. Save the downloaded JSON file securely (you'll need it later)

## Step 4: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "ChronoTunes Song Database"
4. **Important**: Share the sheet with your service account:
   - Click the **Share** button
   - Add your service account email (found in the JSON file as `client_email`)
   - Give it **Editor** permissions
   - Click **Send**

## Step 5: Get Your Spreadsheet ID

1. From your Google Sheet URL, copy the spreadsheet ID
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0`
   - Copy the `SPREADSHEET_ID` part

## Step 6: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and fill in your values:
   ```env
   GOOGLE_SHEETS_ID=your_actual_spreadsheet_id_here
   GOOGLE_SHEETS_NAME=Songs
   ```

3. For the service account, choose **ONE** of these options:

   **Option A: Environment Variable (Recommended for Production)**
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project",...}'
   ```
   Copy the entire contents of your JSON key file as a single line.

   **Option B: File Path (Easier for Development)**
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./path/to/your/service-account-key.json
   ```
   Place your JSON key file in your project directory and reference it.

## Step 7: Initialize Your Google Sheet

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your app in the browser
3. Click the **"Manage Songs"** button (bottom right)
4. Click **"Setup Google Sheets"** to create the proper headers
5. Click **"JSON → Google Sheets"** to sync your existing songs

## Step 8: Using the Integration

### Adding New Songs
1. Click **"Manage Songs"** 
2. Fill out the "Add New Song" form
3. The song will be added directly to Google Sheets

### Editing Songs in Google Sheets
1. Open your Google Sheet
2. Edit any song data directly in the spreadsheet
3. In your app, use **"Google Sheets → JSON"** to sync changes back to your local file

### Two-Way Sync Options
- **JSON → Google Sheets**: Updates Google Sheets with your local JSON data
- **Google Sheets → JSON**: Updates your local JSON file with Google Sheets data

## Google Sheets Format

Your Google Sheet will have these columns:

| Column | Description | Required |
|--------|-------------|----------|
| id | Unique identifier | Yes |
| title | Song title | Yes |
| artist | Artist name | Yes |
| year | Release year | Yes |
| genre | Music genre | No |
| cultural_region | Cultural/geographical region | No |
| historical_significance | Historical context | No |
| spotify_url | Spotify link | No |
| youtube_url | YouTube link | No |
| apple_music_url | Apple Music link | No |

## Troubleshooting

### "Failed to initialize Google Sheets service"
- Check that your service account JSON is valid
- Ensure the Google Sheets API is enabled in your Google Cloud project

### "The caller does not have permission"
- Make sure you shared your Google Sheet with the service account email
- Verify the service account has Editor permissions

### "Spreadsheet not found"
- Double-check your `GOOGLE_SHEETS_ID` in `.env.local`
- Ensure the spreadsheet ID is correct (from the URL)

### Environment Variables Not Loading
- Make sure your `.env.local` file is in the project root
- Restart your development server after changing environment variables
- Check that there are no extra spaces in your environment variables

## Security Notes

1. **Never commit your service account JSON file or `.env.local` to version control**
2. Add `.env.local` and `*.json` (service account files) to your `.gitignore`
3. For production deployment, use environment variables rather than files
4. Regularly rotate your service account keys for security

## Data Flow Options

### Option 1: Google Sheets as Primary Database
- Set your app to always read from Google Sheets
- Edit songs directly in Google Sheets
- No need to sync - changes are immediately available

### Option 2: Hybrid Approach (Recommended)
- Use Google Sheets for editing and adding songs
- Periodically sync to your JSON file for backup
- App can fallback to JSON if Google Sheets is unavailable

### Option 3: JSON Primary with Sheets Backup
- Keep using your JSON file as primary
- Use Google Sheets as a convenient editing interface
- Sync changes back to JSON when ready

## API Endpoints

The integration provides these API endpoints:

- `GET /api/songs?source=auto|sheets|json` - Get songs from specified source
- `POST /api/songs` - Add a new song to Google Sheets
- `POST /api/songs/sync` - Sync between Google Sheets and JSON

## Cost Considerations

- Google Sheets API has generous free quotas (100 requests per 100 seconds per user)
- For most use cases, you won't hit the limits
- Monitor usage in the Google Cloud Console if needed

## Next Steps

1. Complete the setup above
2. Test adding a song through the interface
3. Try editing a song directly in Google Sheets
4. Use sync functions to keep data in sync
5. Consider which data flow option works best for your workflow

You now have a powerful system for managing your song database that combines the convenience of Google Sheets with the flexibility of your application!