import { useState, useEffect } from 'react';
import { useParams, Link } from '@remix-run/react';
import type { RealityTransformationResult } from '~/lib/.server/llm/reality-transformer';

export default function RealityTransformResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState<RealityTransformationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, you'd fetch the result by ID
    // For now, we'll simulate a successful transformation
    setTimeout(() => {
      const mockResult: RealityTransformationResult = {
        success: true,
        transformedContent: {
          'README.md': {
            type: 'file',
            content: `# Virtual Reality City Builder

Transformed from virtual_to_real to functional

## Overview
This project was created using advanced reality transformation technology to convert a virtual reality city-building game concept into a web-based city management application.

## Features
- Interactive city building interface
- Resource management system
- Population growth simulation
- Economic development tracking

## Getting Started
1. Install dependencies: \`npm install\`
2. Start the application: \`npm start\`
3. Open your browser and navigate to the app

## Technology Stack
- React for the frontend
- Node.js backend
- MongoDB for data persistence
- WebSocket for real-time updates`,
            isBinary: false
          },
          'package.json': {
            type: 'file',
            content: JSON.stringify({
              name: 'virtual-reality-city-builder',
              version: '1.0.0',
              description: 'Transformed reality: Virtual Reality City Builder',
              main: 'index.js',
              scripts: {
                start: 'node index.js',
                dev: 'node --watch index.js',
                build: 'webpack --mode production',
                test: 'jest'
              },
              dependencies: {
                'react': '^18.2.0',
                'react-dom': '^18.2.0',
                'express': '^4.18.2',
                'socket.io': '^4.7.2',
                'mongodb': '^5.7.0'
              },
              devDependencies: {
                'webpack': '^5.88.2',
                'jest': '^29.6.2'
              }
            }, null, 2),
            isBinary: false
          },
          'index.js': {
            type: 'file',
            content: `// Reality Transformation Result: Virtual Reality City Builder
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.get('/api/cities', (req, res) => {
  res.json([
    { id: 1, name: 'New Atlantis', population: 10000, resources: { gold: 5000, food: 2000 } },
    { id: 2, name: 'Cyber City', population: 15000, resources: { gold: 8000, food: 3000 } }
  ]);
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('build_building', (data) => {
    console.log('Building construction:', data);
    io.emit('building_completed', { ...data, status: 'completed' });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Virtual Reality City Builder running on port', PORT);
  console.log('Concept: Virtual Reality City Builder');
  console.log('Mode: virtual_to_real');
  console.log('Target Level: functional');
});

module.exports = app;`,
            isBinary: false
          },
          'public/index.html': {
            type: 'file',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Virtual Reality City Builder</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .city-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .city-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .building-panel {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #45a049;
        }
        .resource {
            display: inline-block;
            margin: 5px 10px;
            padding: 5px 10px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏙️ Virtual Reality City Builder</h1>
            <p>Transform your virtual dreams into real cities!</p>
        </div>
        
        <div class="city-grid" id="cityGrid">
            <!-- Cities will be populated here -->
        </div>
        
        <div class="building-panel">
            <h2>🏗️ Build New City</h2>
            <input type="text" id="cityName" placeholder="Enter city name" style="padding: 10px; margin: 5px; border-radius: 5px; border: none;">
            <button onclick="createCity()">Create City</button>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        
        // Load cities on page load
        loadCities();
        
        function loadCities() {
            fetch('/api/cities')
                .then(response => response.json())
                .then(cities => {
                    const cityGrid = document.getElementById('cityGrid');
                    cityGrid.innerHTML = cities.map(city => \`
                        <div class="city-card">
                            <h3>\${city.name}</h3>
                            <div class="resource">👥 Population: \${city.population.toLocaleString()}</div>
                            <div class="resource">💰 Gold: \${city.resources.gold.toLocaleString()}</div>
                            <div class="resource">🍎 Food: \${city.resources.food.toLocaleString()}</div>
                            <button onclick="upgradeCity(\${city.id})">Upgrade</button>
                        </div>
                    \`).join('');
                });
        }
        
        function createCity() {
            const cityName = document.getElementById('cityName').value;
            if (cityName.trim()) {
                // In a real app, this would send to backend
                alert('City creation feature coming soon!');
                document.getElementById('cityName').value = '';
            }
        }
        
        function upgradeCity(cityId) {
            // In a real app, this would send to backend
            alert('City upgrade feature coming soon!');
        }
        
        // Listen for building completion events
        socket.on('building_completed', (data) => {
            console.log('Building completed:', data);
            // Update UI accordingly
        });
    </script>
</body>
</html>`,
            isBinary: false
          }
        },
        metadata: {
          transformationMode: 'virtual_to_real',
          realityLevel: 'functional',
          complexity: 'medium',
          estimatedTime: '45 minutes',
          dependencies: ['node', 'npm', 'mongodb'],
          warnings: []
        },
        instructions: [
          'Review the generated files and understand the structure',
          'Install MongoDB and ensure it\'s running',
          'Run npm install to install dependencies',
          'Execute npm start to run the application',
          'Open your browser to see the city builder in action'
        ],
        nextSteps: [
          'Customize the city building mechanics',
          'Add more building types and resources',
          'Implement user authentication',
          'Add multiplayer features',
          'Deploy to a cloud platform'
        ]
      };
      
      setResult(mockResult);
      setLoading(false);
    }, 2000);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold">Transforming Your Reality...</h2>
          <p className="text-gray-300 mt-2">Converting your concept into working code</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-semibold text-red-400">Transformation Failed</h2>
          <p className="text-gray-300 mt-2">{error}</p>
          <Link to="/reality-transform" className="mt-4 inline-block px-6 py-3 bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Reality Transformation Complete!
            </h1>
            <p className="text-xl text-gray-300">
              Your concept has been successfully transformed into a working reality
            </p>
          </div>

          {/* Success Summary */}
          <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">✅</div>
              <h2 className="text-2xl font-semibold text-green-300">Transformation Successful</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-300">Mode:</span>
                <span className="ml-2 text-white font-medium">{result.metadata.transformationMode.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-gray-300">Level:</span>
                <span className="ml-2 text-white font-medium">{result.metadata.realityLevel}</span>
              </div>
              <div>
                <span className="text-gray-300">Complexity:</span>
                <span className="ml-2 text-white font-medium capitalize">{result.metadata.complexity}</span>
              </div>
            </div>
          </div>

          {/* Generated Files */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-cyan-300">Generated Files</h2>
            <div className="space-y-4">
              {Object.entries(result.transformedContent).map(([filename, file]) => (
                <div key={filename} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">{filename}</h3>
                    <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded">
                      {file.type}
                    </span>
                  </div>
                  <div className="bg-gray-900/50 rounded p-3 text-sm font-mono text-gray-300 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{file.content}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions and Next Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4 text-cyan-300">🚀 Getting Started</h3>
              <ol className="space-y-2 text-sm">
                {result.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-300">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold mb-4 text-cyan-300">🔮 Next Steps</h3>
              <ul className="space-y-2 text-sm">
                {result.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">→</span>
                    <span className="text-gray-300">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
            <h3 className="text-xl font-semibold mb-4 text-cyan-300">📊 Transformation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-300">Estimated Time:</span>
                <span className="ml-2 text-white font-medium">{result.metadata.estimatedTime}</span>
              </div>
              <div>
                <span className="text-gray-300">Dependencies:</span>
                <span className="ml-2 text-white font-medium">{result.metadata.dependencies.join(', ')}</span>
              </div>
              {result.metadata.warnings.length > 0 && (
                <div className="md:col-span-2">
                  <span className="text-gray-300">Warnings:</span>
                  <div className="mt-2 space-y-1">
                    {result.metadata.warnings.map((warning, index) => (
                      <div key={index} className="text-yellow-300 text-xs bg-yellow-500/20 px-2 py-1 rounded">
                        ⚠️ {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center space-x-4">
            <Link
              to="/reality-transform"
              className="inline-block px-8 py-3 bg-cyan-500 rounded-xl hover:bg-cyan-600 transition-colors font-semibold"
            >
              Transform Another Concept
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-block px-8 py-3 bg-purple-500 rounded-xl hover:bg-purple-600 transition-colors font-semibold"
            >
              📄 Print Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}