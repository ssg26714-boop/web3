# ⚡ Stellar Strider

A decentralized GPS-based racing game built on the Stellar blockchain where users compete to set the fastest time for completing geographical loops.

> **🎉 MVP Status**: Fully functional with GPS tracking, loop validation, and MetaMask-style wallet UI!

## 🎯 Features

- **GPS Tracking**: Real-time location tracking using browser geolocation API
- **Loop Validation**: Validates that start and end points are within 50m
- **Smart Contract**: Rust-based Soroban smart contract for recording times
- **Wallet Integration**: MetaMask-style UI powered by Freighter wallet
- **Live Map**: Interactive map showing your current position and path
- **Distance Calculation**: Haversine formula for accurate GPS measurements
- **Modern UI**: Gradient design with smooth animations
- **Mobile Responsive**: Works on desktop and mobile browsers

## 📁 Project Structure

```
stellar-strider/
├── contract/              # Rust smart contract (Soroban)
│   ├── src/lib.rs        # Contract logic
│   ├── Cargo.toml        # Rust dependencies
│   └── target/           # Compiled WASM
├── frontend/              # React web application
│   ├── src/
│   │   ├── App.jsx       # Main application (241 lines)
│   │   └── App.css       # MetaMask-style UI (184 lines)
│   └── package.json      # Node dependencies
├── README.md              # This file
├── QUICKSTART.md          # Quick test guide
├── DEPLOYMENT.md          # Full deployment guide
├── WALLET_GUIDE.md        # Wallet setup & FAQ
└── PROJECT_SUMMARY.md     # Complete project overview
```

## 🚀 Quick Start

### Prerequisites

- Rust (with `wasm32-unknown-unknown` target) ✅
- Node.js (v16+) ✅
- Stellar CLI (optional for deployment)
- **Freighter Wallet** browser extension (Stellar's MetaMask)

> **⚠️ Important**: This app uses **Freighter**, not MetaMask. Freighter is Stellar's wallet (like MetaMask for Ethereum). The UI is styled like MetaMask for familiarity. [Learn more](WALLET_GUIDE.md)

### 1. Smart Contract Setup

```bash
cd contract

# Build the contract
cargo build --target wasm32-unknown-unknown --release

# The compiled WASM will be in:
# target/wasm32-unknown-unknown/release/contract.wasm
```

### 2. Deploy Contract (Optional - For Production)

```bash
# Create identity
stellar keys generate --global user --network testnet

# Deploy to Futurenet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/contract.wasm \
  --source user \
  --network futurenet
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies (already done if you followed setup)
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

## 🎮 How to Use

### First Time Setup:

1. **Install Freighter Wallet**
   - Chrome: [Freighter Wallet](https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk)
   - Create new wallet and save recovery phrase
   - Switch to "Futurenet" network in settings
   - See [WALLET_GUIDE.md](WALLET_GUIDE.md) for detailed setup

### Using the App:

1. **Connect Wallet**
   - Click the orange "🔗 Connect Wallet" button
   - Approve connection in Freighter extension
   - See 🦊 fox avatar when connected (MetaMask-style UI)

2. **Start a Run**
   - Click "Start Run" button
   - Allow location permissions when prompted
   - Walk/run your loop (return to starting point)
   - Watch your path drawn on the map in real-time

3. **Complete the Loop**
   - Click "Stop Run" when you return to start
   - App validates if start/end are within 50m
   - See your time and distance stats

4. **Submit to Blockchain** (requires deployed contract)
   - If loop is valid, click "Submit to Blockchain"
   - Sign transaction in Freighter wallet
   - Your time is recorded on-chain!

## 📝 Smart Contract Functions

### `submit_time`
```rust
pub fn submit_time(
    env: Env,
    user: Address,
    loop_id: String,
    time_seconds: u64,
) -> bool
```
Submits a time for a loop. Creates a new contest or challenges an existing record.

### `get_record`
```rust
pub fn get_record(
    env: Env,
    loop_id: String
) -> Option<ContestRecord>
```
Retrieves the current record holder for a specific loop.

## 🔧 Contract Data Structure

```rust
pub struct ContestRecord {
    pub champion: Address,           // Current record holder
    pub best_time_seconds: u64,      // Best time in seconds
    pub end_timestamp: u64,          // Contest expiration (15 days)
}
```

## 🌐 Technology Stack

- **Smart Contract**: Rust + Soroban SDK v22.0.1
- **Frontend**: React 18 + Vite (Rolldown)
- **Mapping**: Leaflet + React-Leaflet
- **Blockchain**: Stellar Network (Futurenet testnet)
- **Wallet**: Freighter API (with MetaMask-inspired UI)
- **Styling**: Custom CSS with gradient design
- **GPS**: Browser Geolocation API

## 🛠️ Development Notes

### Loop ID Generation
Loop IDs are generated from starting coordinates:
```javascript
const loopId = `loop_${lat.toFixed(4)}_${lon.toFixed(4)}`;
```

### Distance Calculation
Uses Haversine formula for accurate GPS distance:
```javascript
const distance = calculateDistance(lat1, lon1, lat2, lon2);
```

### Validation Rules
- Loop must have at least 3 GPS points
- Start and end must be within 50 meters
- Only valid loops can be submitted to blockchain

## 📱 Testing Locally

Since GPS tracking requires HTTPS or localhost, you can:

1. **Development**: Use `localhost` (works with geolocation)
2. **Mobile Testing**: Use ngrok or similar to create HTTPS tunnel
3. **Simulate GPS**: Use Chrome DevTools to mock location
   - Press F12 → Menu (⋮) → More Tools → Sensors
   - Set custom location coordinates
   - See [QUICKSTART.md](QUICKSTART.md) for detailed GPS simulation guide

## 🚧 Future Enhancements

- [ ] Deploy contract to Futurenet testnet
- [ ] Complete blockchain submission integration
- [ ] NFT minting for champions
- [ ] Leaderboard display for all loops
- [ ] Social features (follow friends, share runs)
- [ ] Challenge expiration enforcement (15 days)
- [ ] Prize pools for popular loops
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Achievement system

## 🏆 Hackathon Submission

Built for the Stellar Meridian hackathon in Pune! 🇮🇳

### Why Stellar?

- **Ultra-low fees**: $0.00001 per transaction (vs Ethereum's $1-50)
- **Fast finality**: 3-5 seconds (vs Ethereum's 15+ seconds)
- **Perfect for gaming**: Frequent, small transactions
- **Modern smart contracts**: Rust-based Soroban
- **Growing ecosystem**: Active development and support

### Project Stats

- **Development Time**: ~2 hours
- **Lines of Code**: 600+
- **Technologies**: 7 (Rust, React, Stellar, Soroban, Leaflet, Vite, Freighter)
- **Status**: MVP Complete ✅

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)**: Test the app in 5 minutes
- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Full deployment guide
- **[WALLET_GUIDE.md](WALLET_GUIDE.md)**: Freighter setup & MetaMask FAQ
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)**: Complete overview

## ❓ FAQ

**Q: Can I use MetaMask?**
A: No, MetaMask doesn't support Stellar. Use Freighter instead - it's Stellar's equivalent. The UI is styled to look like MetaMask for familiarity. [Learn more](WALLET_GUIDE.md)

**Q: Is the app working?**
A: Yes! GPS tracking, loop validation, and wallet connection are fully functional. Blockchain submission requires contract deployment (5-10 min setup).

**Q: How do I test without walking?**
A: Use Chrome DevTools to simulate GPS. See [QUICKSTART.md](QUICKSTART.md) for instructions.

**Q: What's the demo URL?**
A: Currently runs locally at `http://localhost:5173`. Deploy to Vercel/Netlify for live URL.

## 📄 License

MIT

## 🙏 Acknowledgments

- Stellar Foundation & Soroban team
- Freighter wallet developers
- OpenStreetMap contributors
- Leaflet.js developers
- React & Vite teams

## 🤝 Contributing

Contributions welcome! This is a hackathon project that can be expanded into a full product.

**Ideas for contributors:**
- Add leaderboard UI
- Implement NFT minting
- Create mobile app
- Add social features
- Improve GPS accuracy

---

**Happy Striding!** 🏃‍♂️⚡

*Built with ❤️ for the Stellar ecosystem*
