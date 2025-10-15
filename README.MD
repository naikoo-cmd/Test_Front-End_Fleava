# testing_FE_Fleava

A compact Nuxt 3 + TypeScript application built for the Fleava front‑end technical test.  
It showcases a movie listing with a slideshow, infinite scrolling grid, and a details view.  
A mock API lives under `server/api/movies` to simulate server endpoints.

## Technologies
- Nuxt 3 (Vue 3, Vite, Nitro)
- TypeScript
- SCSS (modular, responsive styles)
- Nuxt Server API routes (`server/api`)
- Composition API (`<script setup>`, `useAsyncData`)

## Project Structure
```
app/
  assets/           # Global styles (SCSS)
  components/       # Reusable UI (e.g., MovieCard, Navbar)
  layouts/          # Default layout
  pages/
    index.vue       # Home (slideshow + movie grid)
    movie/[id].vue  # Movie details
public/             # Static assets
server/
  api/
    movies/
      popular.get.ts
      [id].get.ts   # Mock endpoints for movies
nuxt.config.ts
```

## Setup

1) Clone the repository
```bash
git clone https://github.com/naikoo-cmd/testing_FE_Fleava.git
cd testing_FE_Fleava
```

2) Install dependencies
```bash
npm install
```

3) Environment variables
```bash
cp .env.example .env
# If required, add TMDB_API_KEY=<your_key> to .env
```

4) Run the development server
```bash
npm run dev
# http://localhost:3000
```

## Features
- Slideshow hero section for featured movies
- Infinite scroll movie grid (compact, responsive cards)
- Movie details with poster, genres, runtime, rating, overview, director, and cast
- Smooth page transitions and subtle section animations
- Mock server API routes under `server/api/movies`

## Notes
- This repository is provided solely for front‑end testing purposes (Fleava technical test).
- API endpoints are mocked/adapted within `server/api/movies`; external keys may be required depending on your setup.