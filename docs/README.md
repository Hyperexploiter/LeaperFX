# Living Ledger PWA

A task management Progressive Web App (PWA) with room-based organization.

## Features

- Room-based organization for tasks
- Different tile types (Focus, Handshake, Idea)
- Daily Snap-In ritual for prioritizing tasks
- Sunday Reflection Sweep for reviewing progress
- Voice capture for quick idea entry
- Animated UI with smooth transitions
- Fully responsive design
- Works offline as a PWA

## Running Locally

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository or navigate to the project directory:

```bash
cd /Users/hyperexploiter/PycharmProjects/Leaper-Fx/pwa
```

2. Install dependencies:

```bash
npm install
```

3. Generate PWA icons:
   - Open the `public/generate-icons.html` file in a browser
   - Right-click on each SVG icon and save it with the correct filename in the `public` directory

4. Start the development server:

```bash
npm run dev
```

5. Open your browser and navigate to:

```
http://localhost:3000
```

## Building for Production

To build the app for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deploying to Render

1. Create a new Web Service on [Render](https://render.com)

2. Connect your GitHub repository

3. Configure the service:
   - **Name**: living-ledger-pwa
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run serve`
   - **Environment**: Node.js

4. Click "Create Web Service"

5. Your app will be deployed to a URL like: `https://living-ledger-pwa.onrender.com`

## Development Notes

### Project Structure

- `demo.tsx`: Main component with all the functionality
- `main.tsx`: Entry point that renders the main component
- `index.html`: HTML template
- `index.css`: Global CSS styles
- `tailwind.config.js`: Tailwind CSS configuration
- `vite.config.js`: Vite configuration with PWA plugin
- `public/`: Static assets including PWA icons

### Technologies Used

- React with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Lucide React for icons
- Vite PWA plugin for Progressive Web App functionality

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are installed:

```bash
npm install
```

2. Check that the PWA icons exist in the `public` directory

3. Clear your browser cache and reload

4. If you're having issues with the PWA functionality, check the browser console for errors