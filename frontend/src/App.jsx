import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ethers } from 'ethers';
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
  const [isDemoMode, setIsDemoMode] = useState(false);
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

  // Connect MetaMask wallet
  const connectWallet = async () => {
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        if (window.confirm('MetaMask not found. MetaMask is required for Ethereum blockchain.\n\nWould you like to install it now?')) {
          window.open('https://metamask.io/download/', '_blank');
        }
        setMessage('⚠️ Please install MetaMask wallet');
        return;
      }

      setMessage('🔄 Requesting wallet connection...');
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        setIsDemoMode(false);
        setMessage(`✅ MetaMask Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
        
        // Optional: Switch to a specific network (e.g., Ethereum mainnet)
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }], // Ethereum mainnet
          });
        } catch (switchError) {
          console.log('Network switch failed or cancelled:', switchError);
        }
      }
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      if (error.code === 4001) {
        setMessage('❌ Connection rejected. Please approve the connection request.');
      } else if (error.code === -32002) {
        setMessage('⏳ Connection request pending. Please check MetaMask.');
      } else {
        setMessage('❌ Error connecting wallet: ' + error.message);
      }
    }
  };

  // Demo mode with Ethereum address
  const useDemoMode = () => {
    const demoAddress = '0x742d35Cc6634C0532925a3b8D4C9db96590c6C87'; // Example Ethereum address
    setWalletAddress(demoAddress);
    setIsDemoMode(true);
    setMessage(`🎮 Demo Mode: Using demo Ethereum address ${demoAddress.slice(0, 6)}...${demoAddress.slice(-4)}`);
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

  // Listen for MetaMask account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setWalletAddress('');
          setIsDemoMode(false);
          setMessage('🔌 MetaMask disconnected');
        } else if (accounts[0] !== walletAddress && !isDemoMode) {
          setWalletAddress(accounts[0]);
          setMessage(`🔄 Account changed: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [walletAddress, isDemoMode]);

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
      
      setMessage(`Submitting to Ethereum blockchain... Loop ID: ${loopId}, Time: ${elapsedTime}s`);
      
      if (isDemoMode) {
        // Demo mode simulation
        setTimeout(() => {
          setMessage(`✅ Demo Success! Loop ${loopId}, Time: ${elapsedTime}s, Distance: ${distance.toFixed(0)}m`);
        }, 2000);
      } else {
        // Real MetaMask transaction (simplified - would need actual smart contract)
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // This would be a real smart contract call in production
        // For now, we'll just show the transaction would be sent
        setMessage(`✅ Ready to submit to Ethereum! Loop ${loopId}, Time: ${elapsedTime}s, Distance: ${distance.toFixed(0)}m`);
      }
      
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
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
        <h1>⚡ Ethereum Runner</h1>
        {walletAddress ? (
          <div className="wallet-connected">
            <div className="wallet-avatar">{isDemoMode ? '🎮' : '🦊'}</div>
            <div className="wallet-info">
              <div className="wallet-label">{isDemoMode ? 'Demo Mode' : 'Connected'}</div>
              <div className="wallet-address">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </div>
            </div>
          </div>
        ) : (
          <div className="wallet-buttons">
            <button onClick={connectWallet} className="wallet-btn">
              🦊 Connect MetaMask
            </button>
            <button onClick={useDemoMode} className="wallet-btn demo-btn">
              🎮 Use Demo Mode
            </button>
          </div>
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
        <p>🏃 Start a run, complete a loop (return to start), and submit your time to the Ethereum blockchain!</p>
        <p>📍 Loop must start and end within 50 meters to be valid.</p>
      </div>
    </div>
  );
}

export default App;
