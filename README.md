# BluejayQuest

BluejayQuest is an immersive 3D web-based exploration game where players can navigate a virtual representation of Elizabethtown College campus. Control a bird character, interact with the environment, fish in Lake Placida, and explore the beautiful surroundings.

![BluejayQuest Screenshot](/public/gameUi.png)

## Features

### 3D Character Control

- Navigate the map using keyboard controls (WASD)
- Two different bird character models to choose from
- Smooth animations between standing and walking states
- Dynamic camera controls with zoom functionality

### Interactive World

- Detailed 3D environment built on Mapbox and Three.js
- Custom terrain and building rendering
- Collision detection system
- Dynamic lighting for realistic visuals

### Fishing Mini-Game

- Interactive fishing spot at Lake Placida
- Cast your line and catch different fish species
- Four different fish types with varying rarity:
  - Fathead Minnow (common)
  - Bluegill (uncommon)
  - Largemouth Bass (rare)
  - Channel Catfish (very rare)
- Realistic fish size calculation based on species characteristics

### User Authentication & Data Persistence

- Google account login through Supabase integration
- Save your game progress and inventory
- Secure authentication flow
- Personal fish inventory tracking

### Fish Inventory System

- View all caught fish in a detailed inventory UI
- Track statistics like quantity and personal best catches
- See detailed information about each fish species
- Delete unwanted catches from your inventory

## Installation

### Prerequisites

- Node.js (v14 or higher)
- NPM or Yarn package manager
- Mapbox account (free tier available)
- Supabase account (free tier available)

### Setup Instructions

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/BluejayQuest.git
   cd BluejayQuest
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create environment configuration
   Create a `.env` file in the project root with the following variables:

   ```
   VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

   You can get these values from:

   - Mapbox token: https://account.mapbox.com/
   - Supabase credentials: https://supabase.com/ (create a new project)

4. Run the development server

   ```bash
   npx vite
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Database Setup

This project uses Supabase for authentication and data storage. Create the following tables in your Supabase project:

### Fish Inventory Table

```sql
CREATE TABLE fish_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  fish_name TEXT NOT NULL,
  length DECIMAL(5,2) NOT NULL,
  caught_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX fish_inventory_user_id_idx ON fish_inventory(user_id);
```

## Project Structure

```
BluejayQuest/
├── public/             # Static assets (3D models, textures, images)
│   ├── assets/         # Game assets
│   │   ├── fish/       # Fish images
│   │   └── models/     # 3D models
├── src/                # Source code
│   ├── api/            # API integration
│   │   ├── fishInventory.js       # Fish inventory database functions
│   │   └── fishInventoryUI.js     # Fish inventory UI components
│   ├── auth.js         # Authentication functions
│   ├── config.js       # Configuration and environment variables
│   ├── fishingGame.js  # Fishing game mechanics
│   ├── loginScreen.js  # Login UI components
│   ├── main.js         # Main application entry point
│   └── style.css       # Global styles
├── index.html          # Main HTML entry point
└── README.md           # Project documentation
```

## Key Code Components

### Character Animation System

The game loads and manages two different 3D models for each character state:

```javascript
// Load both models
fbxLoader.load(modelPaths.standing, (fbx) => {
  // Standing model setup
});

fbxLoader.load(modelPaths.walking, (fbx) => {
  // Walking model setup
});

// Switch between models based on movement state
function switchBirdModel(isMoving) {
  if (isMoving) {
    currentBird = walkingBird;
    // Start walking animation
  } else {
    currentBird = stillBird;
    // Start standing animation
  }
}
```

### Authentication System

The game integrates with Google authentication via Supabase:

```javascript
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    console.error("Error signing in with Google:", error.message);
    return { success: false, error };
  }

  return { success: true, data };
}
```

## Technologies Used

- **Frontend Framework:** Vanilla JavaScript with Three.js
- **3D Rendering:** Three.js
- **Map Integration:** Mapbox GL JS
- **Authentication & Database:** Supabase
- **Build System:** Vite
- **3D Models:** FBX format, created and animated with Mixamo
- **Development Environment:** Node.js
- **Site Hosting:** Vercel

## Credits and Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [Mapbox GL JS Documentation](https://docs.mapbox.com/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Supabase Documentation](https://supabase.com/docs)
- [Mixamo](https://www.mixamo.com/) - 3D character animations
- [Cursor Documentation](https://docs.cursor.com/context/@-symbols/@-docs)
- [Meshy.ai](https://docs.meshy.ai/) - 3D asset generation
- [Google Gemini](https://gemini.google.com/) - AI assistance
- [Anthropic Claude](https://www.anthropic.com/claude/) - AI assistance
- [OpenAI ChatGPT](https://openai.com/chatgpt/overview/) - AI assistance
- [Vercel](https://vercel.com/docs/) - Site Hosting

## Future Development

- Mobile-responsive controls
- More interactive campus locations(Information of buildings, professors, etc.)
- Quest system with objectives
- Additional mini-games and activities(Basketball at Gym, Swimming at Pool, etc.)
- Achievement system

## License

[MIT License](LICENSE)
