# Bloomberg Terminal Dashboard Layout Understanding

## ASCII Layout Sketch

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              NO HEADER - FULL VIEWPORT WIDTH                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│┌──────────────────────────┬──────────────────────────┬──────────────────────────┐              │
││   CURRENCY COLUMN        │    CRYPTO COLUMN         │  COMMODITIES COLUMN      │              │
││   (Left - flex)          │   (Middle - flex)        │   (Right - flex)         │              │
│  │                       │                        │                       │            │
│  │ ┌────────────────┐    │ ┌──────────────────┐  │ ┌─────────────────┐  │            │
│  │ │ USD/CAD        │    │ │ BTC/CAD          │  │ │ GOLD            │  │            │
│  │ │ Flag | Buy/Sell│    │ │ ▲ +5.2%          │  │ │ ▲ +0.41%        │  │            │
│  │ │ [mini chart]   │    │ │ [mini chart]     │  │ │ [mini chart]    │  │            │
│  │ └────────────────┘    │ └──────────────────┘  │ └─────────────────┘  │            │
│  │                       │                        │                       │            │
│  │ ┌────────────────┐    │ ┌──────────────────┐  │ ┌─────────────────┐  │            │
│  │ │ EUR/CAD        │    │ │ ETH/CAD          │  │ │ SILVER          │  │            │
│  │ │ Flag | Buy/Sell│    │ │ ▼ -2.1%          │  │ │ ▲ +0.32%        │  │            │
│  │ │ [mini chart]   │    │ │ [mini chart]     │  │ │ [mini chart]    │  │            │
│  │ └────────────────┘    │ └──────────────────┘  │ └─────────────────┘  │            │
│  │                       │                        │                       │            │
│  │ (5 currencies total)  │ (6 cryptos visible)   │ ┌─────────────────┐  │            │
│  │                       │ (rotating bottom 3)   │ │ COPPER          │  │            │
│  │                       │                        │ │ ▼ -0.36%        │  │            │
│  │                       │                        │ │ [mini chart]    │  │            │
│  │                       │                        │ └─────────────────┘  │            │
│  │                       │                        │                       │            │
│  │                       │                        │ ┌─────────────────┐  │            │
│  │                       │                        │ │ ALUM.FUT        │  │            │
│  │                       │                        │ │ ▼ -0.21%        │  │            │
│  │                       │                        │ │ [mini chart]    │  │            │
│  │                       │                        │ └─────────────────┘  │            │
│  │                       │                        │                       │            │
│  │                       │                        │ ┌─────────────────┐  │            │
│  │                       │                        │ │ PLAT.           │  │            │
│  │                       │                        │ │ ▼ -0.16%        │  │            │
│  │                       │                        │ │ [mini chart]    │  │            │
│  │                       │                        │ └─────────────────┘  │            │
│  │                       │                        │                       │            │
│  │                       │                        │ ┌─────────────────┐  │            │
│  │                       │                        │ │ CRUDE           │  │            │
│  │                       │                        │ │ ▲ +2.44%        │  │            │
│  │                       │                        │ │ [mini chart]    │  │            │
│  │                       │                        │ └─────────────────┘  │            │
│  │                       │                        │                       │            │
│  │ ┌────────────────┐    │ ┌──────────────────┐  │ (6 visible at once) │
│  │ │ DAILY BULLETIN │    │ │ CAD YIELD (30s)  │  │ (rotating)          │
│  │ │ Orange Border  │    │ │ Rotating bonds   │  │                       │
│  │ │ TOP GAINERS or │    │ │ & indexes        │  │ ┌─────────────────┐  │
│  │ │ TOP LOSERS 60s │    │ │ [chart]          │  │ │ WEATHER + TIME  │  │
│  │ └────────────────┘    │ └──────────────────┘  │ └─────────────────┘  │
│  └──────────────────────┴────────────────────────┴──────────────────────┘
│                                                                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ BOTTOM TICKER BAR (Yellow-Orange Gradient Background)                                  │
│ ┌──────────────────┬────────────────────────────────────────────────────────────────┐│
│ │ SAADAT EXCHANGE  │  Scrolling prices: USD ▲1.35 | EUR ▼1.52 | GBP ▲1.68 ...       ││
│ │ (Text, not PNG)  │  (Ticker content scrolls continuously)                          ││
│ └──────────────────┴────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Color Scheme Requirements

### Background Colors (KEEP ORIGINAL):
- **Base**: Black (#000000) with subtle gradients
- **Currency Cards**: `linear-gradient(135deg, #000000 0%, #000814 50%, #001428 100%)`
- **Crypto Cards**: Same as above (DON'T CHANGE)
- **Commodity Cards**: Same as above (DON'T CHANGE)

### Text Colors:
- **Symbols**: Orange (#FFA500)
- **Prices**: White
- **Positive**: Green (#00FF88) with ▲
- **Negative**: Red (#FF4444) with ▼

### Special Elements:

1. **DAILY BULLETIN** (Keep EXACT same styling):
   - Orange border (#FFA500)
   - Orange header text
   - CONTENT: Rotate between TOP GAINERS and TOP LOSERS (60s)
   - Same background as before

2. **SAADAT TICKER BAR**:
   - BACKGROUND: Yellow-orange gradient (#FFD700 → #FF6B00)
   - TEXT: "SAADAT EXCHANGE" (not logo PNG)
   - Style: Monospace font, blue/cyan color for text

3. **Charts**:
   - More professional, synchronized movements
   - Slicker rectangles with proper borders
   - Smooth data transitions

## What NOT to Change:
- Widget background colors (they were fine)
- Basic layout structure
- Arrow symbols (keep ▲▼)
- Font styles

## What TO Fix:
1. Remove colored PNG logo, use TEXT "SAADAT EXCHANGE"
2. Apply gradient to ticker BAR background, not logo
3. Keep Daily Bulletin styling, just change content to gainers/losers
4. Make charts more professional with better animations
5. Keep all original background colors for cards