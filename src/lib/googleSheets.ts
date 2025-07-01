import { google } from 'googleapis';
import { Song } from './playlistGenerator';

// Configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '';
const SHEET_NAME = 'Songs';

// Column mapping for the spreadsheet
const COLUMN_MAPPING = {
  id: 'A',
  title: 'B',
  artist: 'C',
  year: 'D',
  genre: 'E',
  cultural_region: 'F',
  historical_significance: 'G',
  spotify_url: 'H',
  youtube_url: 'I',
  apple_music_url: 'J'
};

// Initialize Google Sheets client
async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// Create headers if spreadsheet is empty
async function ensureHeaders() {
  const sheets = await getGoogleSheetsClient();
  
  try {
    // Check if headers exist
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:J1`,
    });

    if (!headerResponse.data.values || headerResponse.data.values.length === 0) {
      // Add headers
      const headers = [
        'ID', 'Title', 'Artist', 'Year', 'Genre', 'Cultural Region', 
        'Historical Significance', 'Spotify URL', 'YouTube URL', 'Apple Music URL'
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:J1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
    }
  } catch (error) {
    console.error('Error ensuring headers:', error);
    throw error;
  }
}

// Read all songs from Google Sheets
export async function readSongsFromSheets(): Promise<Song[]> {
  if (!SPREADSHEET_ID) {
    throw new Error('GOOGLE_SHEETS_ID environment variable is not set');
  }

  const sheets = await getGoogleSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:J1000`, // Skip header row
    });

    if (!response.data.values) {
      return [];
    }

    const songs: Song[] = response.data.values.map((row: any[], index: number) => ({
      id: parseInt(row[0]) || index + 1,
      title: row[1] || '',
      artist: row[2] || '',
      year: parseInt(row[3]) || 0,
      genre: row[4] || '',
      cultural_region: row[5] || '',
      historical_significance: row[6] || '',
      spotify_url: row[7] || undefined,
      youtube_url: row[8] || undefined,
      apple_music_url: row[9] || undefined,
    })).filter(song => song.title && song.artist); // Filter out empty rows

    return songs;
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    throw error;
  }
}

// Write all songs to Google Sheets (overwrites existing data)
export async function writeSongsToSheets(songs: Song[]): Promise<void> {
  if (!SPREADSHEET_ID) {
    throw new Error('GOOGLE_SHEETS_ID environment variable is not set');
  }

  const sheets = await getGoogleSheetsClient();
  
  try {
    // Ensure headers exist
    await ensureHeaders();

    // Clear existing data (except headers)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:J1000`,
    });

    // Prepare data rows
    const rows = songs.map(song => [
      song.id,
      song.title,
      song.artist,
      song.year,
      song.genre,
      song.cultural_region,
      song.historical_significance || '',
      song.spotify_url || '',
      song.youtube_url || '',
      song.apple_music_url || '',
    ]);

    if (rows.length > 0) {
      // Write new data
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2:J${rows.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: rows,
        },
      });
    }

    console.log(`Successfully wrote ${songs.length} songs to Google Sheets`);
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    throw error;
  }
}

// Add a single song to the end of the spreadsheet
export async function addSongToSheets(song: Song): Promise<void> {
  if (!SPREADSHEET_ID) {
    throw new Error('GOOGLE_SHEETS_ID environment variable is not set');
  }

  const sheets = await getGoogleSheetsClient();
  
  try {
    await ensureHeaders();

    const row = [
      song.id,
      song.title,
      song.artist,
      song.year,
      song.genre,
      song.cultural_region,
      song.historical_significance || '',
      song.spotify_url || '',
      song.youtube_url || '',
      song.apple_music_url || '',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:J`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    console.log(`Successfully added song "${song.title}" to Google Sheets`);
  } catch (error) {
    console.error('Error adding song to Google Sheets:', error);
    throw error;
  }
}

// Update a specific song in the spreadsheet
export async function updateSongInSheets(song: Song, rowIndex: number): Promise<void> {
  if (!SPREADSHEET_ID) {
    throw new Error('GOOGLE_SHEETS_ID environment variable is not set');
  }

  const sheets = await getGoogleSheetsClient();
  
  try {
    const row = [
      song.id,
      song.title,
      song.artist,
      song.year,
      song.genre,
      song.cultural_region,
      song.historical_significance || '',
      song.spotify_url || '',
      song.youtube_url || '',
      song.apple_music_url || '',
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowIndex + 2}:J${rowIndex + 2}`, // +2 because of header and 0-based index
      valueInputOption: 'RAW',
      requestBody: {
        values: [row],
      },
    });

    console.log(`Successfully updated song "${song.title}" in Google Sheets`);
  } catch (error) {
    console.error('Error updating song in Google Sheets:', error);
    throw error;
  }
}

// Create a new Google Spreadsheet with the song data
export async function createNewSpreadsheet(title: string = 'ChronoTunes Song Database'): Promise<string> {
  const sheets = await getGoogleSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: title,
        },
        sheets: [{
          properties: {
            title: SHEET_NAME,
          },
        }],
      },
    });

    const spreadsheetId = response.data.spreadsheetId!;
    console.log(`Created new spreadsheet with ID: ${spreadsheetId}`);
    console.log(`Spreadsheet URL: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
    
    return spreadsheetId;
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
}

// Test connection to Google Sheets
export async function testSheetsConnection(): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();
    
    if (!SPREADSHEET_ID) {
      throw new Error('GOOGLE_SHEETS_ID environment variable is not set');
    }

    // Try to get spreadsheet metadata
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    console.log(`Successfully connected to spreadsheet: ${response.data.properties?.title}`);
    return true;
  } catch (error) {
    console.error('Error testing Google Sheets connection:', error);
    return false;
  }
}