# Frontend Testing Project

Welcome to the **Frontend Testing Project** repository!  
This repository contains the result of a frontend technical test. It is intended to demonstrate coding skills, code structure, UI implementation, and API integration to the development team or reviewers.

> This project was not continued because it uses Nuxt 4, which doesn’t meet the required test version. However, I uploaded it to my repository list for reference.


## Project Overview

This project is built using modern frontend technologies and demonstrates best practices in your chosen framework (e.g., Vue, Nuxt, etc.). The main features include:

- Fetching movie data from The Movie Database (TMDB) API.
- Displaying movie lists, details, and other related information.
- Responsive and clean UI design.
- Well-organized and maintainable code structure.

## Demo

You can run and test this project locally by following the instructions below.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/naikoo-cmd/Test_Front-End_Fleava
cd Test_Front-End_Fleava
```

### 2. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/) installed.

```bash
npm install nuxt@latest
```

### 3. Setup Environment Variables

This project requires a TMDB API key.  
You can find a sample configuration in the provided `.env.example` file.

- Copy `.env.example` to `.env`:

    ```bash
    cp .env.example .env
    ```

- Open `.env` and replace `YOUR_TMDB_API_KEY` with your own API key.  
  You can [sign up for a free API key here](https://www.themoviedb.org/settings/api).

Alternatively, you may use the default key provided if available, but it is recommended to use your own for full functionality.

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000) (or the port specified in your `.env`).

## Notes

- **TMDB API Usage:**  
  All movie data is fetched from [The Movie Database (TMDB)](https://www.themoviedb.org/). Please ensure your API key is valid.
- **Environment Variables:**  
  All sensitive or runtime configuration is managed via environment variables. Check `.env.example` for the required variables.
- **Customization:**  
  Feel free to use your own TMDB API key or modify the project as needed for further testing or feature implementation.

## Folder Structure

```
app/
  assets/
    styles/      # SCSS files for global and component styling
  components/    # Reusable UI components
  layouts/       # Layout components and wrappers
  pages/         # Application pages/views
  plugins/       # Animate
  ...
public/          # Static assets (images, favicon, etc.)
server/
  api/
    movies/      # Server-side API endpoints for movie data handling
```

## Testing

If there are test scripts available, you can run:

```bash
npm run test
```

## Feedback

If you have any questions, suggestions, or need further clarification, please feel free to open an issue or contact me directly.

---

~~Thank you for reviewing this frontend test project!~~
