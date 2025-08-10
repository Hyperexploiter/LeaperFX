import React, { useState, useEffect, useRef } from 'react';
import { Bluetooth, Plus, Mic, Calendar, RotateCcw, Zap, Users, Lightbulb, Check, Trash2, Home, ChefHat, Coffee, Gamepad2, BookOpen } from 'lucide-react';

// Tile types and states
const TILE_TYPES = {
  FOCUS: 'focus',
  HANDSHAKE: 'handshake',
  IDEA: 'idea',
  COMPLETED: 'completed'
};

const TILE_STATES = {
  ACTIVE: 'active',
  PENDING: 'pending',
  DONE: 'done',
  GREY: 'grey'
};

// Room definitions
const ROOMS = {
  PERSONAL: {
    id: 'personal',
    name: 'Personal',
    icon: Home,
    bgActive: 'bg-blue-100',
    borderActive: 'border-blue-300',
    textActive: 'text-blue-600',
    textActiveSecondary: 'text-blue-700',
    badgeActive: 'bg-blue-500'
  },
  SHARED: {
    id: 'shared',
    name: 'Shared',
    icon: Users,
    bgActive: 'bg-purple-100',
    borderActive: 'border-purple-300',
    textActive: 'text-purple-600',
    textActiveSecondary: 'text-purple-700',
    badgeActive: 'bg-purple-500'
  },
  KITCHEN: {
    id: 'kitchen',
    name: 'Kitchen',
    icon: ChefHat,
    bgActive: 'bg-green-100',
    borderActive: 'border-green-300',
    textActive: 'text-green-600',
    textActiveSecondary: 'text-green-700',
    badgeActive: 'bg-green-500'
  },
  LIVING: {
    id: 'living',
    name: 'Living Room',
    icon: Coffee,
    bgActive: 'bg-orange-100',
    borderActive: 'border-orange-300',
    textActive: 'text-orange-600',
    textActiveSecondary: 'text-orange-700',
    badgeActive: 'bg-orange-500'
  },
  STUDY: {
    id: 'study',
    name: 'Study',
    icon: BookOpen,
    bgActive: 'bg-indigo-100',
    borderActive: 'border-indigo-300',
    textActive: 'text-indigo-600',
    textActiveSecondary: 'text-indigo-700',
    badgeActive: 'bg-indigo-500'
  },
  FUN: {
    id: 'fun',
    name: 'Fun Zone',
    icon: Gamepad2,
    bgActive: 'bg-pink-100',
    borderActive: 'border-pink-300',
    textActive: 'text-pink-600',
    textActiveSecondary: 'text-pink-700',
    badgeActive: 'bg-pink-500'
  }
};

// Sample tile data per room
const initialRoomTiles = {
  personal: [
    { id: 1, type: TILE_TYPES.FOCUS, state: TILE_STATES.ACTIVE, text: "Finish Q2 Report", position: { x: 200, y: 150 }, createdAt: new Date() },
    { id: 2, type: TILE_TYPES.FOCUS, state: TILE_STATES.ACTIVE, text: "Review PRs", position: { x: 300, y: 200 }, createdAt: new Date() }
  ],
  shared: [
    { id: 3, type: TILE_TYPES.HANDSHAKE, state: TILE_STATES.PENDING, text: "Morning Run", position: { x: 400, y: 150 }, partner: "Alex", createdAt: new Date() },
    { id: 4, type: TILE_TYPES.FOCUS, state: TILE_STATES.ACTIVE, text: "Plan Weekend Trip", position: { x: 200, y: 250 }, createdAt: new Date() }
  ],
  kitchen: [
    { id: 5, type: TILE_TYPES.FOCUS, state: TILE_STATES.ACTIVE, text: "Grocery Shopping", position: { x: 150, y: 180 }, createdAt: new Date() },
    { id: 6, type: TILE_TYPES.HANDSHAKE, state: TILE_STATES.ACTIVE, text: "Meal Prep Sunday", position: { x: 350, y: 220 }, partner: "Sam", createdAt: new Date() }
  ],
  living: [
    { id: 7, type: TILE_TYPES.IDEA, state: TILE_STATES.ACTIVE, text: "Movie night ideas", position: { x: 250, y: 160 }, votes: 5, createdAt: new Date() }
  ],
  study: [
    { id: 8, type: TILE_TYPES.FOCUS, state: TILE_STATES.ACTIVE, text: "Learn React animations", position: { x: 180, y: 200 }, createdAt: new Date() }
  ],
  fun: [
    { id: 9, type: TILE_TYPES.IDEA, state: TILE_STATES.ACTIVE, text: "Board game tournament", position: { x: 220, y: 180 }, votes: 2, createdAt: new Date() }
  ]
};

export default function LivingLedgerPWA() {
  const [currentRoom, setCurrentRoom] = useState('personal');
  const [roomTiles, setRoomTiles] = useState(initialRoomTiles);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isListening, setIsListening] = useState(false);
  const [showAddTile, setShowAddTile] = useState(false);
  const [newTileText, setNewTileText] = useState('');
  const [newTileType, setNewTileType] = useState(TILE_TYPES.FOCUS);
  const [currentView, setCurrentView] = useState('board');
  const [dailyFocusTiles, setDailyFocusTiles] = useState([]);
  const [completionParticles, setCompletionParticles] = useState([]);
  const [animatingTiles, setAnimatingTiles] = useState(new Set());

  const recognitionRef = useRef(null);

  const currentTiles = roomTiles[currentRoom] || [];

  // Particle effect for tile completion
  const createCompletionParticles = (x, y) => {
    const particles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1
    }));
    setCompletionParticles(prev => [...prev, ...particles]);

    // Animate particles
    const animateParticles = () => {
      setCompletionParticles(prev =>
        prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.1, // gravity
          life: p.life - 0.02
        })).filter(p => p.life > 0)
      );
    };

    const interval = setInterval(animateParticles, 16);
    setTimeout(() => clearInterval(interval), 1000);
  };

  // Web Bluetooth connection simulation
  const connectToDevice = async () => {
    setConnectionStatus('connecting');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      if ('bluetooth' in navigator) {
        console.log('Would connect to Living Ledger Hub via BLE');
      }

      setIsConnected(true);
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('error');
      console.error('Connection failed:', error);
    }
  };

  // Voice recognition for idea capture
  const startVoiceCapture = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        addTile(transcript, TILE_TYPES.IDEA);
      };

      recognitionRef.current.start();
    } else {
      const text = prompt('Enter your idea:');
      if (text) addTile(text, TILE_TYPES.IDEA);
    }
  };

  // Add new tile with entrance animation
  const addTile = (text, type = TILE_TYPES.FOCUS) => {
    const newTile = {
      id: Date.now(),
      type,
      state: TILE_STATES.ACTIVE,
      text,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      createdAt: new Date(),
      votes: type === TILE_TYPES.IDEA ? 0 : undefined,
      partner: type === TILE_TYPES.HANDSHAKE ? 'Partner' : undefined
    };

    setRoomTiles(prev => ({
      ...prev,
      [currentRoom]: [...(prev[currentRoom] || []), newTile]
    }));

    // Trigger entrance animation
    setAnimatingTiles(prev => new Set(prev).add(`enter-${newTile.id}`));
    setTimeout(() => {
      setAnimatingTiles(prev => {
        const next = new Set(prev);
        next.delete(`enter-${newTile.id}`);
        return next;
      });
    }, 600);

    setNewTileText('');
    setShowAddTile(false);
  };

  // Update tile state with animation
  const updateTileState = (tileId, newState) => {
    const tile = currentTiles.find(t => t.id === tileId);
    if (tile && newState === TILE_STATES.DONE) {
      createCompletionParticles(tile.position.x + 48, tile.position.y + 48);
      setAnimatingTiles(prev => new Set(prev).add(`complete-${tileId}`));
      setTimeout(() => {
        setAnimatingTiles(prev => {
          const next = new Set(prev);
          next.delete(`complete-${tileId}`);
          return next;
        });
      }, 800);
    }

    setRoomTiles(prev => ({
      ...prev,
      [currentRoom]: prev[currentRoom].map(tile =>
        tile.id === tileId
          ? { ...tile, state: newState, completedAt: newState === TILE_STATES.DONE ? new Date() : tile.completedAt }
          : tile
      )
    }));
  };

  // Switch room with animation
  const switchRoom = (roomId) => {
    if (roomId === currentRoom) return;

    // Fade out current tiles
    setAnimatingTiles(prev => new Set([...prev, 'room-transition']));

    setTimeout(() => {
      setCurrentRoom(roomId);
      setAnimatingTiles(prev => {
        const next = new Set(prev);
        next.delete('room-transition');
        return next;
      });
    }, 200);
  };

  // Daily Snap-In ritual
  const startDailySnapIn = () => {
    const allTiles = Object.values(roomTiles).flat();
    const availableFocusTiles = allTiles.filter(tile =>
      tile.type === TILE_TYPES.FOCUS && tile.state === TILE_STATES.ACTIVE
    );
    setDailyFocusTiles(availableFocusTiles.slice(0, 3));
    setCurrentView('daily');
  };

  // Sunday reflection sweep
  const startReflectionSweep = () => {
    setCurrentView('reflection');
  };

  const getAllTiles = () => Object.values(roomTiles).flat();

  const calculateStreaks = () => {
    return getAllTiles().filter(tile => tile.state === TILE_STATES.DONE).length;
  };

  const getCompostCandidates = () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return getAllTiles().filter(tile =>
      tile.state === TILE_STATES.ACTIVE &&
      new Date(tile.createdAt) < weekAgo
    );
  };

  // Tile component with enhanced animations
  const TileComponent = ({ tile, onClick, isDraggable = false }) => {
    const isEntering = animatingTiles.has(`enter-${tile.id}`);
    const isCompleting = animatingTiles.has(`complete-${tile.id}`);
    const isRoomTransitioning = animatingTiles.has('room-transition');

    const getTileColor = () => {
      switch (tile.type) {
        case TILE_TYPES.FOCUS: 
          return tile.state === TILE_STATES.DONE 
            ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' 
            : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300';
        case TILE_TYPES.HANDSHAKE: 
          return tile.state === TILE_STATES.DONE 
            ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300' 
            : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300';
        case TILE_TYPES.IDEA: 
          return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300';
        case TILE_TYPES.COMPLETED: 
          return 'bg-gradient-to-br from-green-50 to-green-100 border-green-300';
        default: 
          return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300';
      }
    };

    const getIconBg = () => {
      switch (tile.type) {
        case TILE_TYPES.FOCUS: 
          return tile.state === TILE_STATES.DONE ? 'bg-green-200' : 'bg-blue-200';
        case TILE_TYPES.HANDSHAKE: 
          return tile.state === TILE_STATES.DONE ? 'bg-green-200' : 'bg-purple-200';
        case TILE_TYPES.IDEA: 
          return 'bg-yellow-200';
        case TILE_TYPES.COMPLETED: 
          return 'bg-green-200';
        default: 
          return 'bg-gray-200';
      }
    };

    const getIcon = () => {
      switch (tile.type) {
        case TILE_TYPES.FOCUS: return <Zap className="w-4 h-4" />;
        case TILE_TYPES.HANDSHAKE: return <Users className="w-4 h-4" />;
        case TILE_TYPES.IDEA: return <Lightbulb className="w-4 h-4" />;
        default: return <Check className="w-4 h-4" />;
      }
    };

    return (
      <div
        className={`
          relative w-28 h-28 rounded-xl border-2 ${getTileColor()}
          flex flex-col items-center justify-center p-3 cursor-pointer
          transition-all duration-300 hover:scale-110 hover:shadow-xl hover:z-10
          ${tile.state === TILE_STATES.DONE ? 'opacity-85' : ''}
          ${isEntering ? 'animate-bounce' : ''}
          ${isCompleting ? 'animate-pulse scale-125' : ''}
          ${isRoomTransitioning ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}
          ${tile.type === TILE_TYPES.IDEA ? 'animate-pulse' : ''}
          ${tile.state === TILE_STATES.ACTIVE && tile.type === TILE_TYPES.FOCUS ? 'shadow-md shadow-blue-200' : ''}
        `}
        onClick={onClick}
        style={isDraggable ? {
          position: 'absolute',
          left: tile.position.x,
          top: tile.position.y,
          animation: tile.type === TILE_TYPES.HANDSHAKE && tile.state === TILE_STATES.ACTIVE ?
            'float 3s ease-in-out infinite' : 'none'
        } : {}}
      >
        <div className={`flex items-center justify-center mb-2 p-2 rounded-full ${getIconBg()}`}>
          {getIcon()}
        </div>

        <div className="text-sm text-center leading-tight font-medium w-full">
          {tile.text}
        </div>

        {/* Partner or votes indicator */}
        <div className="mt-1 flex items-center justify-center">
          {tile.partner && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              👥 {tile.partner}
            </span>
          )}
          {tile.votes !== undefined && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full animate-pulse">
              ❤️ {tile.votes}
            </span>
          )}
        </div>

        {tile.state === TILE_STATES.DONE && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Breathing animation for active focus tiles */}
        {tile.state === TILE_STATES.ACTIVE && tile.type === TILE_TYPES.FOCUS && (
          <div className="absolute inset-0 rounded-xl bg-blue-200 opacity-20 animate-ping"></div>
        )}
      </div>
    );
  };

  // Room selector component
  const RoomSelector = () => (
    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
      {Object.values(ROOMS).map(room => {
        const IconComponent = room.icon;
        const isActive = currentRoom === room.id;
        const tileCount = (roomTiles[room.id] || []).length;

        return (
          <button
            key={room.id}
            onClick={() => switchRoom(room.id)}
            className={`
              flex flex-col items-center gap-2 p-4 rounded-xl min-w-24 transition-all duration-300
              ${isActive 
                ? `${room.bgActive} border-2 ${room.borderActive} scale-105 shadow-lg` 
                : 'bg-white border border-slate-200 hover:bg-slate-50 hover:scale-102 hover:shadow-md'
              }
              ${tileCount > 0 && !isActive ? 'border-l-4 border-l-blue-400' : ''}
            `}
          >
            <div className={`
              p-2 rounded-full 
              ${isActive ? room.bgActive : 'bg-slate-100'}
            `}>
              <IconComponent className={`w-6 h-6 ${isActive ? room.textActive : 'text-slate-600'}`} />
            </div>
            <span className={`text-sm font-medium ${isActive ? room.textActiveSecondary : 'text-slate-600'}`}>
              {room.name}
            </span>
            {tileCount > 0 && (
              <div className={`
                w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold
                ${isActive ? `${room.badgeActive} text-white shadow-sm` : 'bg-blue-400 text-white shadow-sm'}
              `}>
                {tileCount}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative">
      {/* CSS for custom animations and patterns */}
      <style>
        {`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Background pattern */
        .bg-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.05) 2px, transparent 0),
            radial-gradient(circle at 75px 75px, rgba(59, 130, 246, 0.05) 2px, transparent 0);
          background-size: 100px 100px;
          pointer-events: none;
          z-index: 0;
        }
        `}
      </style>

      {/* Background pattern */}
      <div className="bg-pattern"></div>

      {/* Header */}
      <header className="bg-white shadow-md border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <span className="bg-blue-500 text-white p-1 rounded-lg mr-2">LL</span>
            Living Ledger
          </h1>

          {/* Connection Status */}
          <div className="flex items-center gap-4">
            <button
              onClick={connectToDevice}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm
                ${isConnected 
                  ? 'bg-gradient-to-r from-green-400 to-green-500 text-white border border-green-300 animate-pulse' 
                  : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white border border-blue-300 hover:shadow-md hover:scale-105'
                }
              `}
            >
              <Bluetooth className="w-4 h-4" />
              {connectionStatus === 'connecting' ? 'Connecting...' :
               isConnected ? 'Connected' : 'Connect Hub'}
            </button>
          </div>
        </div>
      </header>

      {/* Room Navigation */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <RoomSelector />
        </div>
      </div>

      {/* View Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-2 flex gap-2">
          {['board', 'daily', 'reflection'].map(view => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all
                ${currentView === view 
                  ? 'bg-blue-100 text-blue-700 scale-105' 
                  : 'text-slate-600 hover:bg-slate-100 hover:scale-102'
                }
              `}
            >
              {view}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4">
        {currentView === 'board' && (
          <div>
            {/* Action Bar */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowAddTile(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:scale-105 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Tile
              </button>

              <button
                onClick={startVoiceCapture}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                  ${isListening 
                    ? 'bg-red-500 text-white animate-pulse scale-105' 
                    : 'bg-yellow-500 text-white hover:bg-yellow-600 hover:scale-105'
                  }
                `}
              >
                <Mic className="w-4 h-4" />
                {isListening ? 'Listening...' : 'Voice Idea'}
              </button>

              <button
                onClick={startDailySnapIn}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 hover:scale-105 transition-all"
              >
                <Calendar className="w-4 h-4" />
                Daily Snap-In
              </button>

              <button
                onClick={startReflectionSweep}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 hover:scale-105 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Sunday Sweep
              </button>
            </div>

            {/* Board View */}
            <div className="relative bg-white rounded-xl shadow-sm border min-h-96 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white">
                {currentTiles.map(tile => (
                  <TileComponent
                    key={tile.id}
                    tile={tile}
                    isDraggable={true}
                    onClick={() => {
                      if (tile.state === TILE_STATES.ACTIVE) {
                        updateTileState(tile.id, TILE_STATES.DONE);
                      } else if (tile.state === TILE_STATES.DONE) {
                        updateTileState(tile.id, TILE_STATES.ACTIVE);
                      }
                    }}
                  />
                ))}

                {/* Completion Particles */}
                {completionParticles.map(particle => (
                  <div
                    key={particle.id}
                    className="absolute w-2 h-2 bg-green-400 rounded-full pointer-events-none"
                    style={{
                      left: particle.x,
                      top: particle.y,
                      opacity: particle.life,
                      transform: `scale(${particle.life})`
                    }}
                  />
                ))}
              </div>

              {currentTiles.length === 0 && (
                <div className="flex items-center justify-center h-96 text-slate-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🏠</div>
                    <div>No tiles in {ROOMS[currentRoom]?.name || 'this room'} yet</div>
                    <div className="text-sm">Add some tasks to get started!</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'daily' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Daily Snap-In Ritual</h2>
            <p className="text-slate-600 mb-6">Choose your 3 focus tiles for today:</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dailyFocusTiles.map((tile, index) => (
                <div key={tile.id} className="text-center">
                  <div className="mb-2 text-sm font-medium text-slate-500">Focus {index + 1}</div>
                  <TileComponent
                    tile={tile}
                    onClick={() => updateTileState(tile.id, TILE_STATES.DONE)}
                  />
                </div>
              ))}
            </div>

            {dailyFocusTiles.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                No focus tiles available. Add some tiles first!
              </div>
            )}
          </div>
        )}

        {currentView === 'reflection' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-4">Sunday Reflection Sweep</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-green-700">Completed This Week</h3>
                <div className="space-y-2">
                  {getAllTiles().filter(tile => tile.state === TILE_STATES.DONE).map(tile => (
                    <div key={tile.id} className="flex items-center gap-2 p-2 bg-green-50 rounded transition-all hover:scale-102">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{tile.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-orange-700">Compost Candidates</h3>
                <div className="space-y-2">
                  {getCompostCandidates().map(tile => (
                    <div key={tile.id} className="flex items-center gap-2 p-2 bg-orange-50 rounded transition-all hover:scale-102">
                      <Trash2 className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">{tile.text}</span>
                      <span className="text-xs text-orange-500 ml-auto">7+ days old</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-700 mb-2">Weekly Stats</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="transition-all hover:scale-105">
                  <div className="text-2xl font-bold text-blue-600">{getAllTiles().filter(t => t.state === TILE_STATES.DONE).length}</div>
                  <div className="text-sm text-blue-600">Completed</div>
                </div>
                <div className="transition-all hover:scale-105">
                  <div className="text-2xl font-bold text-orange-600">{getCompostCandidates().length}</div>
                  <div className="text-sm text-orange-600">Stale</div>
                </div>
                <div className="transition-all hover:scale-105">
                  <div className="text-2xl font-bold text-green-600">{calculateStreaks()}</div>
                  <div className="text-sm text-green-600">Streak</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Tile Modal */}
      {showAddTile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-lg font-bold mb-4">Add New Tile</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Room</label>
                <div className="text-sm text-slate-600 mb-2">Adding to: {ROOMS[currentRoom]?.name || 'Unknown Room'}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <select
                  value={newTileType}
                  onChange={(e) => setNewTileType(e.target.value)}
                  className="w-full p-2 border rounded-lg transition-all hover:border-blue-300 focus:border-blue-500"
                >
                  <option value={TILE_TYPES.FOCUS}>Focus Tile</option>
                  <option value={TILE_TYPES.HANDSHAKE}>Handshake Tile</option>
                  <option value={TILE_TYPES.IDEA}>Idea Seed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Text</label>
                <input
                  type="text"
                  value={newTileText}
                  onChange={(e) => setNewTileText(e.target.value)}
                  placeholder="What needs attention?"
                  className="w-full p-2 border rounded-lg transition-all hover:border-blue-300 focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => addTile(newTileText, newTileType)}
                  disabled={!newTileText.trim()}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                >
                  Add Tile
                </button>
                <button
                  onClick={() => setShowAddTile(false)}
                  className="flex-1 border border-slate-300 py-2 rounded-lg hover:bg-slate-50 hover:scale-105 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
