import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as StellarSdk from 'stellar-sdk';
import { isConnected, getPublicKey, signTransaction } from '@stellar/freighter-api';
import './App.css';

// Component to recenter map
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [path, setPath] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [distance, setDistance] = useState(0);
  const [message, setMessage] = useState('');
  const watchIdRef = useRef(null);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      const connected = await isConnected();
      if (connected) {
        const publicKey = await getPublicKey();
        setWalletAddress(publicKey);
        setMessage(`✅ Wallet Connected: ${publicKey.slice(0, 8)}...${publicKey.slice(-4)}`);
      } else {
        // Show install prompt
        if (window.confirm('Freighter wallet not found. Freighter is required for Stellar blockchain.\n\nWould you like to install it now?')) {
          window.open('https://freighter.app', '_blank');
        }
        setMessage('⚠️ Please install Freighter wallet for Stellar');
      }
    } catch (error) {
      setMessage('❌ Error connecting wallet: ' + error.message);
    }
  };

  // Update elapsed time
  useEffect(() => {
    let interval;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  // Start tracking
  const startRun = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation not supported');
      return;
    }

    setIsTracking(true);
    setStartTime(Date.now());
    setPath([]);
    setDistance(0);
    setMessage('Tracking started...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPos = [position.coords.latitude, position.coords.longitude];
        setCurrentPosition(newPos);
        
        setPath((prevPath) => {
          if (prevPath.length > 0) {
            const lastPos = prevPath[prevPath.length - 1];
            const dist = calculateDistance(lastPos[0], lastPos[1], newPos[0], newPos[1]);
            setDistance((prevDist) => prevDist + dist);
          }
          return [...prevPath, newPos];
        });
      },
      (error) => {
        setMessage('GPS Error: ' + error.message);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // Stop tracking
  const stopRun = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    setIsTracking(false);
    
    // Validate loop
    if (path.length > 2) {
      const start = path[0];
      const end = path[path.length - 1];
      const loopDistance = calculateDistance(start[0], start[1], end[0], end[1]);
      
      if (loopDistance > 50) {
        setMessage(`Invalid loop! Start and end are ${loopDistance.toFixed(0)}m apart (must be < 50m)`);
      } else {
        setMessage(`Valid loop! Time: ${elapsedTime}s, Distance: ${distance.toFixed(0)}m`);
      }
    }
  };

  // Submit to blockchain
  const submitToBlockchain = async () => {
    if (!walletAddress) {
      setMessage('Please connect wallet first');
      return;
    }

    if (path.length < 2) {
      setMessage('No valid run to submit');
      return;
    }

    const start = path[0];
    const end = path[path.length - 1];
    const loopDistance = calculateDistance(start[0], start[1], end[0], end[1]);

    if (loopDistance > 50) {
      setMessage('Cannot submit invalid loop');
      return;
    }

    try {
      // Generate loop ID from starting coordinates
      const loopId = `loop_${start[0].toFixed(4)}_${start[1].toFixed(4)}`;
      
      setMessage(`Submitting to blockchain... Loop ID: ${loopId}, Time: ${elapsedTime}s`);
      
      // For now, just show success (actual blockchain integration requires deployed contract)
      setMessage(`Success! Would submit: Loop ${loopId}, Time: ${elapsedTime}s to Stellar`);
      
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app">
      <div className="header">
        <h1>⚡ Stellar Strider</h1>
        {walletAddress ? (
          <div className="wallet-connected">
            <div className="wallet-avatar">🦊</div>
            <div className="wallet-info">
              <div className="wallet-label">Connected</div>
              <div className="wallet-address">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            </div>
          </div>
        ) : (
          <button onClick={connectWallet} className="wallet-btn">
            🔗 Connect Wallet
          </button>
        )}
      </div>

      <div className="map-container">
        <MapContainer
          center={currentPosition || [28.6139, 77.2090]}
          zoom={15}
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {currentPosition && <MapController center={currentPosition} />}
          {path.length > 0 && <Polyline positions={path} color="blue" weight={4} />}
          {currentPosition && <Marker position={currentPosition} />}
        </MapContainer>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="label">Time:</span>
          <span className="value">{formatTime(elapsedTime)}</span>
        </div>
        <div className="stat">
          <span className="label">Distance:</span>
          <span className="value">{distance.toFixed(0)}m</span>
        </div>
        <div className="stat">
          <span className="label">Points:</span>
          <span className="value">{path.length}</span>
        </div>
      </div>

      <div className="controls">
        {!isTracking ? (
          <button onClick={startRun} className="btn btn-start">
            Start Run
          </button>
        ) : (
          <button onClick={stopRun} className="btn btn-stop">
            Stop Run
          </button>
        )}
        
        {!isTracking && path.length > 0 && (
          <button onClick={submitToBlockchain} className="btn btn-submit">
            Submit to Blockchain
          </button>
        )}
      </div>

      {message && (
        <div className="message">
          {message}
        </div>
      )}

      <div className="info">
        <p>🏃 Start a run, complete a loop (return to start), and submit your time to the Stellar blockchain!</p>
        <p>📍 Loop must start and end within 50 meters to be valid.</p>
      </div>
    </div>
  );
}

export default App;
