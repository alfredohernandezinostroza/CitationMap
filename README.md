# Citation Network Analysis Tool (GitHub Pages Version)

This is a static version of the Citation Network Analysis Tool designed to work with GitHub Pages. This version processes all data in the browser without requiring a server.

## Features

- Upload and parse GEXF/GraphML network files directly in the browser
- Interactive visualization with sigma.js
- Filter networks by cluster, author, and year
- View paper details
- Top rankings by subfield
- Publication trends analysis

## How to Deploy to GitHub Pages

1. Fork or clone this repository
2. Enable GitHub Pages in the repository settings
   - Go to Settings > Pages
   - Select the "main" branch and "/docs" folder (or wherever you placed these files)
   - Click "Save"
3. Your application will be available at: `https://yourusername.github.io/repository-name/`

## Usage

1. Upload a GEXF or GraphML file 
2. Explore the network visualization by zooming and panning
3. Click on nodes to view paper details
4. Use filters to focus on specific clusters, authors, or year ranges
5. Visit the Rankings page to see top papers and authors by subfield

## Data Storage

This application uses browser localStorage to store graph data between page visits. This means:

- Data is stored locally in your browser
- No data is sent to any server
- Data persists between page reloads
- Clearing your browser data will remove the stored graph

## Technologies Used

- Frontend: HTML, CSS, JavaScript, Bootstrap 5
- Visualization: sigma.js, graphology, plotly.js, noUiSlider

## License

MIT