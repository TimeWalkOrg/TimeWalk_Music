import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

// Configuration
const SPREADSHEET_ID = '1c88b1aT_Iufmc-tztfPMPFZeUVQ8J2BTXnLbAPnWkKA';
const RANGE = 'Sheet1!A:J'; // Covers all columns we need

// Define the song structure
export interface Song {
  id: number;
  title: string;
  artist: string;
  year: number;
  genre: string;
  cultural_region: string;
  historical_significance: string;
  spotify_url?: string;
  youtube_url?: string;
  apple_music_url?: string;
}

// Headers for the Google Sheet
const HEADERS = [
  'ID',
  'Title',
  'Artist',
  'Year',
  'Genre',
  'Cultural Region',
  'Historical Significance',
  'Spotify URL',
  'YouTube URL',
  'Apple Music URL'
];

class GoogleSheetsService {
  private auth: GoogleAuth;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sheets: any;

  constructor() {
    // Initialize Google Auth
    this.auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
      credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 
        JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY) : undefined,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  /**
   * Convert song object to row array
   */
  private songToRow(song: Song): (string | number)[] {
    return [
      song.id,
      song.title,
      song.artist,
      song.year,
      song.genre,
      song.cultural_region,
      song.historical_significance,
      song.spotify_url || '',
      song.youtube_url || '',
      song.apple_music_url || ''
    ];
  }

  /**
   * Convert row array to song object
   */
  private rowToSong(row: (string | number)[]): Song {
    return {
      id: Number(row[0]) || 0,
      title: String(row[1] || ''),
      artist: String(row[2] || ''),
      year: Number(row[3]) || 0,
      genre: String(row[4] || ''),
      cultural_region: String(row[5] || ''),
      historical_significance: String(row[6] || ''),
      spotify_url: row[7] ? String(row[7]) : undefined,
      youtube_url: row[8] ? String(row[8]) : undefined,
      apple_music_url: row[9] ? String(row[9]) : undefined
    };
  }

  /**
   * Push songs from JSON to Google Sheets
   */
  async pushSongsToSheets(songs: Song[]): Promise<void> {
    try {
      // Prepare data with headers
      const values = [
        HEADERS,
        ...songs.map(song => this.songToRow(song))
      ];

      // Clear existing data and write new data
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      });

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
        valueInputOption: 'RAW',
        resource: {
          values,
        },
      });

      console.log(`Successfully pushed ${songs.length} songs to Google Sheets`);
    } catch (error) {
      console.error('Error pushing to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Pull songs from Google Sheets
   */
  async pullSongsFromSheets(): Promise<Song[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        return [];
      }

      // Skip header row and convert to songs
      const songs = rows.slice(1)
        .filter((row: unknown[]) => Array.isArray(row) && row[0] && row[1]) // Filter out empty rows
        .map((row: unknown[]) => this.rowToSong(row as (string | number)[]));

      console.log(`Successfully pulled ${songs.length} songs from Google Sheets`);
      return songs;
    } catch (error) {
      console.error('Error pulling from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Append a new song to the sheet
   */
  async appendSong(song: Song): Promise<void> {
    try {
      const values = [this.songToRow(song)];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:J',
        valueInputOption: 'RAW',
        resource: {
          values,
        },
      });

      console.log(`Successfully appended song: ${song.title}`);
    } catch (error) {
      console.error('Error appending song to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Update a specific song by ID
   */
  async updateSong(song: Song): Promise<void> {
    try {
      // First, find the row with this ID
      const songs = await this.pullSongsFromSheets();
      const rowIndex = songs.findIndex(s => s.id === song.id);
      
      if (rowIndex === -1) {
        throw new Error(`Song with ID ${song.id} not found`);
      }

      // Update the specific row (add 2 to account for header row and 0-based indexing)
      const sheetRow = rowIndex + 2;
      const range = `Sheet1!A${sheetRow}:J${sheetRow}`;
      
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: range,
        valueInputOption: 'RAW',
        resource: {
          values: [this.songToRow(song)],
        },
      });

      console.log(`Successfully updated song: ${song.title}`);
    } catch (error) {
      console.error('Error updating song in Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Get the next available ID
   */
  async getNextId(): Promise<number> {
    const songs = await this.pullSongsFromSheets();
    if (songs.length === 0) return 1;
    return Math.max(...songs.map(s => s.id)) + 1;
  }
}

export default GoogleSheetsService;