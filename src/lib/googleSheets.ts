import { google } from 'googleapis';
import { Song } from './playlistGenerator';

// Google Sheets configuration
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  serviceAccountKeyPath?: string;
  serviceAccountKey?: object;
}

export class GoogleSheetsService {
  private auth: any;
  private sheets: any;
  private config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
  }

  async initialize() {
    try {
      // Initialize Google Auth
      if (this.config.serviceAccountKey) {
        // Use service account key object (for production with env vars)
        this.auth = new google.auth.GoogleAuth({
          credentials: this.config.serviceAccountKey,
          scopes: SCOPES,
        });
      } else if (this.config.serviceAccountKeyPath) {
        // Use service account key file (for development)
        this.auth = new google.auth.GoogleAuth({
          keyFile: this.config.serviceAccountKeyPath,
          scopes: SCOPES,
        });
      } else {
        throw new Error('Either serviceAccountKey or serviceAccountKeyPath must be provided');
      }

      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    } catch (error) {
      console.error('Failed to initialize Google Sheets service:', error);
      throw error;
    }
  }

  async createSongsSheet(): Promise<void> {
    try {
      // Create header row
      const headers = [
        'id',
        'title',
        'artist',
        'year',
        'genre',
        'cultural_region',
        'historical_significance',
        'spotify_url',
        'youtube_url',
        'apple_music_url'
      ];

      const values = [headers];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.sheetName}!A1:J1`,
        valueInputOption: 'RAW',
        resource: { values },
      });

      console.log('Songs sheet headers created successfully');
    } catch (error) {
      console.error('Failed to create songs sheet:', error);
      throw error;
    }
  }

  async getSongsFromSheet(): Promise<Song[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.sheetName}!A:J`,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        console.log('No data found in the sheet');
        return [];
      }

      // Skip header row and convert to Song objects
      const songs: Song[] = rows.slice(1).map((row: string[], index: number) => {
        // Handle missing values with defaults
        const [
          id,
          title,
          artist,
          year,
          genre,
          cultural_region,
          historical_significance,
          spotify_url,
          youtube_url,
          apple_music_url
        ] = row;

        if (!title || !artist || !year) {
          console.warn(`Skipping row ${index + 2}: missing required fields`);
          return null;
        }

        return {
          id: id ? parseInt(id) : index + 1,
          title: title || '',
          artist: artist || '',
          year: year ? parseInt(year) : 0,
          genre: genre || '',
          cultural_region: cultural_region || '',
          historical_significance: historical_significance || '',
          spotify_url: spotify_url || '',
          youtube_url: youtube_url || '',
          apple_music_url: apple_music_url || ''
        };
      }).filter(Boolean) as Song[];

      console.log(`Retrieved ${songs.length} songs from Google Sheets`);
      return songs;
    } catch (error) {
      console.error('Failed to get songs from sheet:', error);
      throw error;
    }
  }

  async updateSongsInSheet(songs: Song[]): Promise<void> {
    try {
      // Clear existing data (except headers)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.sheetName}!A2:J`,
      });

      if (songs.length === 0) {
        console.log('No songs to update');
        return;
      }

      // Convert songs to rows
      const values = songs.map(song => [
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
      ]);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.sheetName}!A2:J${values.length + 1}`,
        valueInputOption: 'RAW',
        resource: { values },
      });

      console.log(`Updated ${songs.length} songs in Google Sheets`);
    } catch (error) {
      console.error('Failed to update songs in sheet:', error);
      throw error;
    }
  }

  async addSongToSheet(song: Omit<Song, 'id'>): Promise<Song> {
    try {
      // Get current songs to determine next ID
      const existingSongs = await this.getSongsFromSheet();
      const nextId = existingSongs.length > 0 
        ? Math.max(...existingSongs.map(s => s.id)) + 1 
        : 1;

      const newSong: Song = { ...song, id: nextId };

      // Append the new song
      const values = [[
        newSong.id,
        newSong.title,
        newSong.artist,
        newSong.year,
        newSong.genre,
        newSong.cultural_region,
        newSong.historical_significance,
        newSong.spotify_url || '',
        newSong.youtube_url || '',
        newSong.apple_music_url || ''
      ]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.sheetName}!A:J`,
        valueInputOption: 'RAW',
        resource: { values },
      });

      console.log(`Added new song: ${newSong.title} by ${newSong.artist}`);
      return newSong;
    } catch (error) {
      console.error('Failed to add song to sheet:', error);
      throw error;
    }
  }

  async deleteSongFromSheet(songId: number): Promise<void> {
    try {
      const songs = await this.getSongsFromSheet();
      const filteredSongs = songs.filter(song => song.id !== songId);
      
      if (filteredSongs.length === songs.length) {
        throw new Error(`Song with ID ${songId} not found`);
      }

      await this.updateSongsInSheet(filteredSongs);
      console.log(`Deleted song with ID: ${songId}`);
    } catch (error) {
      console.error('Failed to delete song from sheet:', error);
      throw error;
    }
  }

  async syncFromJsonToSheet(jsonFilePath: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const jsonData = await fs.readFile(jsonFilePath, 'utf-8');
      const songs: Song[] = JSON.parse(jsonData);
      
      await this.updateSongsInSheet(songs);
      console.log(`Synced ${songs.length} songs from JSON to Google Sheets`);
    } catch (error) {
      console.error('Failed to sync from JSON to sheet:', error);
      throw error;
    }
  }

  async syncFromSheetToJson(jsonFilePath: string): Promise<void> {
    try {
      const songs = await this.getSongsFromSheet();
      const fs = await import('fs/promises');
      
      await fs.writeFile(jsonFilePath, JSON.stringify(songs, null, 2));
      console.log(`Synced ${songs.length} songs from Google Sheets to JSON`);
    } catch (error) {
      console.error('Failed to sync from sheet to JSON:', error);
      throw error;
    }
  }
}

// Helper function to create and configure the service
export function createGoogleSheetsService(): GoogleSheetsService {
  const config: GoogleSheetsConfig = {
    spreadsheetId: process.env.GOOGLE_SHEETS_ID || '',
    sheetName: process.env.GOOGLE_SHEETS_NAME || 'Songs',
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
      ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
      : undefined,
    serviceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
  };

  if (!config.spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_ID environment variable is required');
  }

  return new GoogleSheetsService(config);
}