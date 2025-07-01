# ChronoTunes - Temporal Music Playlist Generator

> **Live Demo**: Coming soon! 🚀

Generates music playlists for any year and location in history (e.g., "1664, New Amsterdam" or "1950, America"). Experience the sounds of different eras through temporal interpolation algorithms.

## ✨ Features

- 🎵 **Historical Music Database**: Curated songs from 1660-2025
- 🧮 **Temporal Interpolation**: Smart algorithm weighs songs by historical proximity
- 📍 **Location-Aware**: Considers cultural regions and historical context
- 🎯 **Diverse Playlists**: Generates 10-song playlists with artist/genre diversity
- 🎨 **Beautiful UI**: Modern, responsive design with Tailwind CSS
- ⚡ **Fast**: Built with Next.js 14 and TypeScript

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/TimeWalkOrg/TimeWalk_Music.git
   cd TimeWalk_Music
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

## 🎮 Try These Examples

- **"1664, New Amsterdam"** - Dutch colonial period
- **"1776, America"** - Revolutionary War era
- **"1890, London"** - Victorian era
- **"1930, New York"** - Jazz Age & Great Depression
- **"1950, America"** - Birth of Rock & Roll
- **"2020, Global"** - Modern era

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Data**: JSON (MVP), PostgreSQL (future)
- **Deployment**: Vercel
- **Algorithm**: Custom temporal interpolation

## 📚 How It Works

### Temporal Interpolation Algorithm

```typescript
function calculateTemporalWeight(songYear: number, queryYear: number): number {
  const distance = Math.abs(songYear - queryYear);
  if (distance > 50) return 0;
  
  // Exponential decay based on temporal distance
  return Math.exp(-distance / 20);
}
```

### Location Relevance Mapping

Historical locations are mapped to cultural regions:
- **New Amsterdam** → Dutch influences, New York
- **1776 America** → Early American folk, patriotic songs
- **Victorian London** → British cultural influence

### Playlist Generation

1. Calculate temporal weights for all songs
2. Apply location relevance multipliers
3. Sort by combined weight
4. Apply diversity constraints (max 2 per artist, 3 per genre)
5. Select top 10 songs

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub** (already done)
   ```bash
   git push origin main
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Connect GitHub account
   - Import `TimeWalkOrg/TimeWalk_Music`
   - Deploy automatically

3. **Environment Setup**
   No environment variables needed for MVP!

### Alternative Deployment Options

- **Railway**: `railway up`
- **Netlify**: Connect GitHub repository
- **Cloudflare Pages**: Import from GitHub

## 📈 Roadmap

### Phase 1: MVP ✅ **COMPLETE**
- [x] Basic Next.js app with temporal interpolation
- [x] JSON database with seed data
- [x] Core playlist generation algorithm
- [x] Beautiful UI with Tailwind CSS
- [x] GitHub repository setup

### Phase 2: Enhancement (Next)
- [ ] PostgreSQL database migration
- [ ] Apple Music API integration
- [ ] User authentication & saved playlists
- [ ] Advanced location-based weighting
- [ ] Historical context display
- [ ] Social sharing features

### Phase 3: Scale & Polish
- [ ] Multiple music service support (Spotify, TIDAL)
- [ ] Advanced caching strategies
- [ ] Analytics and monitoring
- [ ] Mobile app (React Native)

## 🎵 Song Database

Currently includes **25 carefully curated songs** spanning:

### 📊 Google Sheets Integration

The song database can now be managed via Google Sheets! This allows for easy editing, collaborative updates, and real-time synchronization.

**Quick Setup:**
```bash
# Create a new Google Spreadsheet with your data
npm run sync:create

# Upload existing songs to Google Sheets
npm run sync:upload

# Download updates from Google Sheets
npm run sync:download
```

📖 **[Complete Setup Guide](./GOOGLE_SHEETS_SETUP.md)**

- **1660s**: Colonial/Baroque (Greensleeves, Barbara Allen)
- **1770s**: Revolutionary War (Yankee Doodle, Liberty Song)
- **1890s**: Victorian/Ragtime (Maple Leaf Rag, After the Ball)
- **1930s**: Jazz Age (Ain't She Sweet, Brother Can You Spare a Dime)
- **1950s**: Rock & Roll Birth (Rock Around the Clock, Blue Suede Shoes)
- **Modern**: Contemporary hits (Billie Eilish, The Weeknd, Taylor Swift)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is part of [TimeWalk.org](http://timewalk.org) - an open-source initiative for historical education.

## 🙏 Acknowledgments

- [TimeWalk.org](http://timewalk.org) for the project vision
- Historical music data from public domain sources
- Next.js team for the amazing framework
- Tailwind CSS for beautiful styling

---

**Built with ❤️ for history and music lovers**
