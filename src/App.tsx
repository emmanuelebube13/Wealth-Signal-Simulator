import React, { useState, useMemo, useEffect } from 'react';
import { generateCells } from './utils/simulation';
import { SignalWeights, CellData } from './types';
import { Info, Map, Target, Layers, Smartphone, Moon, Home, Users, ChevronDown, ChevronUp, AlertCircle, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CountUp } from './components/CountUp';

// Pre-generate grid
const initialCells = generateCells();

function getCellColor(score: number) {
  // score is 0 to 100
  // low: #3A4570 (rgb(58, 69, 112))
  // high: #F2B33D (rgb(242, 179, 61))
  const c1 = [58, 69, 112];
  const c2 = [242, 179, 61];
  
  const ratio = score / 100;
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * ratio);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * ratio);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * ratio);
  
  return `rgb(${r}, ${g}, ${b})`;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [cells, setCells] = useState<CellData[]>(initialCells);
  const [weights, setWeights] = useState<SignalWeights>({
    nightlight: 25,
    mobile: 25,
    building: 25,
    population: 25,
  });
  const [targetingMode, setTargetingMode] = useState<'naive' | 'weighted'>('weighted');
  const [isArticleOpen, setIsArticleOpen] = useState(false);
  const [slidersOpen, setSlidersOpen] = useState(true);

  // Auto-close sliders on mobile by default if desired, but we can start with them open
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSlidersOpen(false);
    }
  }, []);

  const regenerateData = () => setCells(generateCells());

  const handleWeightChange = (key: keyof SignalWeights, newValue: number) => {
    const clampedNew = Math.max(0, Math.min(100, newValue));
    let diff = clampedNew - weights[key];
    
    const others = (Object.keys(weights) as (keyof SignalWeights)[]).filter(k => k !== key);
    let sumOthers = others.reduce((acc, k) => acc + weights[k], 0);

    const nextWeights = { ...weights, [key]: clampedNew };

    if (sumOthers === 0) {
      others.forEach(k => {
        nextWeights[k] = (100 - clampedNew) / 3;
      });
    } else {
      others.forEach(k => {
        nextWeights[k] = weights[k] - diff * (weights[k] / sumOthers);
      });
    }
    
    setWeights(nextWeights);
  };

  const scoredCells = useMemo(() => {
    return cells.map(cell => {
      const score = 
        cell.nightlight * (weights.nightlight / 100) +
        cell.mobile * (weights.mobile / 100) +
        cell.building * (weights.building / 100) +
        cell.population * (weights.population / 100);
      return { ...cell, score };
    });
  }, [cells, weights]);

  const truePoorestIds = useMemo(() => {
    return [...scoredCells]
      .sort((a, b) => a.groundTruth - b.groundTruth)
      .slice(0, 16)
      .map(c => c.id);
  }, [scoredCells]);

  const targetedNaiveIds = useMemo(() => {
    return [...scoredCells]
      .sort((a, b) => a.population - b.population)
      .slice(0, 16)
      .map(c => c.id);
  }, [scoredCells]);

  const targetedWeightedIds = useMemo(() => {
    return [...scoredCells]
      .sort((a, b) => a.score - b.score)
      .slice(0, 16)
      .map(c => c.id);
  }, [scoredCells]);

  const activeTargetedIds = targetingMode === 'naive' ? targetedNaiveIds : targetedWeightedIds;
  
  const naiveHits = targetedNaiveIds.filter(id => truePoorestIds.includes(id)).length;
  const weightedHits = targetedWeightedIds.filter(id => truePoorestIds.includes(id)).length;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-theme-base text-theme-body font-sans transition-colors duration-300 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        <div className="w-full max-w-[1024px] flex flex-col gap-6 flex-1 h-full">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-theme pb-4 gap-4 w-full shrink-0">
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight uppercase mb-1">Wealth Signal Simulator</h1>
              <p className="text-theme-muted text-sm max-w-2xl">
                Educational Interactive: Estimating Regional Economic Disparity via Non-Traditional Data
              </p>
            </div>
            <div className="flex flex-col md:items-end items-start gap-3 w-full md:w-auto">
              <div className="bg-amber-950/20 dark:bg-amber-950/30 border border-amber-900/40 p-2 rounded text-[10px] max-w-full md:max-w-[300px] text-amber-700 dark:text-amber-200 uppercase tracking-wider leading-relaxed text-left md:text-right hidden sm:block">
                DISCLAIMER: Simulation uses synthetic, randomly generated data. Not connected to real survey data.
              </div>
              <div className="flex justify-between items-center w-full md:w-auto gap-3">
                <div className="sm:hidden flex items-center justify-center p-2 bg-amber-950/20 dark:bg-amber-950/30 border border-amber-900/40 rounded group relative"
                  tabIndex={0}>
                   <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-300 pointer-events-none" />
                   <div className="absolute top-12 left-0 bg-theme-card border border-theme p-2.5 text-[10px] w-56 shadow-xl rounded hidden group-hover:block group-focus:block z-50 text-amber-700 dark:text-amber-200 font-medium">
                     DISCLAIMER: Simulation uses synthetic, randomly generated data. Not connected to real survey data.
                   </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setDarkMode(!darkMode)} 
                    className="p-2 bg-theme-card hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors border border-theme flex-shrink-0"
                    aria-label="Toggle Dark Mode"
                  >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <button onClick={regenerateData} className="px-4 py-2 bg-theme-accent hover:bg-theme-hover rounded-md text-xs font-bold uppercase tracking-wider transition-colors text-white whitespace-nowrap">
                    Regenerate Synthesis
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="flex flex-col md:flex-row gap-8 w-full flex-1 min-h-0">
            
            {/* Controls - Left Panel */}
            <aside className="w-full md:w-[35%] lg:w-[320px] flex flex-col gap-6 shrink-0">
              
              <div className="bg-theme-card border border-theme rounded-lg overflow-hidden transition-colors duration-300 shadow-sm">
                <button 
                  className="w-full p-4 flex items-center justify-between md:cursor-default hover:bg-black/5 dark:hover:bg-white/5 md:hover:bg-transparent"
                  onClick={() => window.innerWidth < 768 && setSlidersOpen(!slidersOpen)}
                >
                  <h2 className="text-xs font-semibold text-theme-muted uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4 text-theme-accent" />
                    Signal Weighting (%)
                  </h2>
                  <ChevronDown className={`w-4 h-4 md:hidden text-theme-muted transition-transform ${slidersOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {slidersOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 overflow-hidden"
                    >
                      <div className="space-y-5">
                        <SliderControl 
                          label="Nighttime Lights" 
                          icon={<Moon size={14}/>} 
                          value={weights.nightlight} 
                          onChange={(val) => handleWeightChange('nightlight', val)} 
                          helpText="Brighter areas at night usually mean more electrified infrastructure — a real proxy used in published poverty-mapping research."
                        />
                        <SliderControl 
                          label="Mobile Connectivity" 
                          icon={<Smartphone size={14}/>} 
                          value={weights.mobile} 
                          onChange={(val) => handleWeightChange('mobile', val)} 
                          helpText="Higher connectivity density correlates with wealth, capturing economic activity missed by legacy censuses."
                        />
                        <SliderControl 
                          label="Road & Building Infra" 
                          icon={<Home size={14}/>} 
                          value={weights.building} 
                          onChange={(val) => handleWeightChange('building', val)} 
                          helpText="Dense, well-built infrastructure extracted from daytime satellite imagery is a strong asset wealth proxy."
                        />
                        <SliderControl 
                          label="Population Density" 
                          icon={<Users size={14}/>} 
                          value={weights.population} 
                          onChange={(val) => handleWeightChange('population', val)} 
                          helpText="Used to normalize other signals or weight regions, though raw population alone is a flawed proxy for wealth."
                        />
                      </div>

                      <div className="bg-black/5 dark:bg-white/5 border border-theme p-3 rounded-lg mt-6">
                        <h3 className="text-[10px] font-bold text-theme-muted uppercase mb-1">How this score is calculated</h3>
                        <p className="text-xs text-theme-body mb-2 opacity-80">Aggregates configured signals into a poverty-probability map.</p>
                        <p className="text-sm font-mono text-theme-accent tracking-tighter">
                          S = NL({(weights.nightlight/100).toFixed(2)}) + MC({(weights.mobile/100).toFixed(2)}) + IF({(weights.building/100).toFixed(2)}) + PD({(weights.population/100).toFixed(2)})
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Comparison Panel */}
              <div className="bg-theme-card border border-theme rounded-lg p-4 transition-colors duration-300 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold text-theme-muted uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-4 h-4 text-theme-accent" />
                    Targeting
                  </h2>
                  <div className="flex gap-2">
                    {targetingMode === 'weighted' && (
                      <button className="flex items-center gap-1.5 bg-theme-accent/20 px-2 py-1 rounded text-[10px] font-bold text-theme-accent border border-theme-accent/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse"></div>
                        WEIGHTED
                      </button>
                    )}
                    {targetingMode === 'naive' && (
                      <button className="flex items-center gap-1.5 bg-black/10 dark:bg-white/10 px-2 py-1 rounded text-[10px] font-bold text-theme-body">
                        NAIVE
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setTargetingMode('naive')}
                    className={`p-3 rounded text-left transition-colors border ${targetingMode === 'naive' ? 'bg-black/5 dark:bg-white/5 border-theme-muted' : 'border-theme hover:border-theme-muted'}`}
                  >
                    <div className={`text-[10px] uppercase mb-1 drop-shadow-sm ${targetingMode === 'naive' ? 'text-theme-body font-bold' : 'text-theme-muted'}`}>Naive Geographic</div>
                    <div className={`text-xl font-bold font-mono ${targetingMode === 'naive' ? 'text-theme-body' : 'text-theme-body/60'}`}>
                      <CountUp end={naiveHits} duration={0.6}/> <span className="text-xs font-sans font-normal text-theme-muted">/ 16</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => setTargetingMode('weighted')}
                    className={`p-3 rounded text-left transition-colors border ${targetingMode === 'weighted' ? 'bg-theme-accent/10 border-theme-accent/50' : 'border-theme hover:border-theme-muted'}`}
                  >
                    <div className={`text-[10px] uppercase mb-1 drop-shadow-sm ${targetingMode === 'weighted' ? 'text-theme-accent font-bold' : 'text-theme-muted'}`}>Weighted Signal</div>
                    <div className={`text-xl font-bold font-mono ${targetingMode === 'weighted' ? 'text-theme-accent' : 'text-theme-body/60'}`}>
                      <CountUp end={weightedHits} duration={0.6}/> <span className="text-xs font-sans font-normal text-theme-muted">/ 16</span>
                    </div>
                  </button>
                </div>
                <p className="text-[11px] text-theme-muted mt-3">Targeting aims to correctly identify absolute poorest cells (n=16) in region.</p>
              </div>

            </aside>

            {/* Visualization - Right Panel */}
            <main className="w-full md:w-auto md:flex-1 flex flex-col min-w-0">
              <div className="flex justify-between items-end mb-3 shrink-0">
                <h2 className="text-xs font-semibold text-theme-muted uppercase tracking-widest flex items-center gap-2">
                  <Map className="w-4 h-4 text-theme-accent" />
                  Simulated Region (8x8)
                </h2>
                <div className="flex gap-2 text-[10px] uppercase text-theme-muted items-center">
                  <span>Low</span>
                  <div className="flex h-3 w-16 sm:w-24 rounded overflow-hidden" style={{ background: 'linear-gradient(to right, #3A4570, #F2B33D)' }} />
                  <span className="hidden sm:inline">High Wealth</span>
                  <span className="sm:hidden">High</span>
                </div>
              </div>

              <div className="w-full bg-theme-card rounded-xl p-3 sm:p-6 lg:p-8 border border-theme flex flex-col justify-center items-center transition-colors duration-300 shadow-sm flex-1 min-h-[300px]">
                {/* Grid map */}
                <div className="w-full aspect-square max-w-[500px] grid grid-cols-8 grid-rows-8 gap-1.5 sm:gap-2">
                  {scoredCells.map((cell) => {
                    const isTargeted = activeTargetedIds.includes(cell.id);
                    const bgColor = getCellColor(cell.score);
                    // Ratio helps control glow brightness
                    const ratio = cell.score / 100;
                    const glowSpread = 8 + (ratio * 12); // softer spread
                    const glowOpacity = darkMode ? (0.2 + (ratio * 0.4)) : (0.4 + (ratio * 0.4));
                    const glowColor = darkMode ? 'rgba(255,255,255,' : 'rgba(255,255,255,'; // White glow works on both
                    const boxShadow = `inset 0 0 ${glowSpread}px 1px ${glowColor}${glowOpacity})`;
                    
                    return (
                      <motion.div 
                        key={cell.id} 
                        className="relative rounded-[6px] sm:rounded-[10px] overflow-hidden"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          backgroundColor: bgColor,
                          boxShadow: boxShadow
                        }}
                        transition={{ 
                          // Entrance stagger uses delay, subsequent changes do not
                          opacity: { delay: (cell.row * 8 + cell.col) * 0.01, duration: 0.4 },
                          scale: { delay: (cell.row * 8 + cell.col) * 0.01, duration: 0.4 },
                          backgroundColor: { duration: 0.4, ease: "easeInOut" },
                          boxShadow: { duration: 0.4, ease: "easeInOut" }
                        }}
                        title={`Score: ${cell.score.toFixed(1)}\nNL: ${cell.nightlight} | MC: ${cell.mobile}\nBldg: ${cell.building} | Pop: ${cell.population}`}
                      >
                        {/* Pulse effect when targeting changes */}
                        <AnimatePresence>
                          {isTargeted && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ 
                                opacity: [0, 1, 0.2], 
                                scale: [0.8, 1, 1],
                                border: darkMode ? '2px solid rgba(255,255,255, 0.9)' : '2px solid rgba(0,0,0, 0.8)'
                              }}
                              exit={{ opacity: [0.2, 1, 0], scale: [1, 1.1, 1.1] }}
                              transition={{ duration: 0.5 }}
                              className={`absolute inset-0 rounded-[6px] sm:rounded-[10px] box-border pointer-events-none`}
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
                
                <div className="mt-6 flex flex-wrap justify-center sm:justify-between items-center text-[10px] text-theme-muted gap-4 w-full max-w-[500px]">
                  <div className="flex items-center gap-1.5 uppercase tracking-wide">
                    <div className={`w-3 h-3 border-2 ${darkMode ? 'border-white/90' : 'border-zinc-900/90'} rounded-[2px]`} />
                    IDENTIFIED AID TARGET (BOTTOM 25%)
                  </div>
                  <p className="hidden sm:block">Hover cells for specific signal readouts</p>
                </div>
              </div>
            </main>

          </div>

          {/* About Panel (Collapsible) */}
          <section className="border border-theme rounded-lg overflow-hidden shrink-0 bg-theme-card transition-colors duration-300 shadow-sm w-full">
            <button 
              onClick={() => setIsArticleOpen(!isArticleOpen)}
              className="w-full px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-theme-body">
                <Info className="w-4 h-4 text-theme-accent" />
                About This Research (Context & Reality)
              </h3>
              <span className="text-lg leading-none text-theme-muted">{isArticleOpen ? '−' : '+'}</span>
            </button>
            
            <AnimatePresence>
              {isArticleOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="p-4 sm:p-6 bg-black/5 dark:bg-white/5 text-xs sm:text-sm leading-relaxed border-t border-theme grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-h-[400px] overflow-y-auto">
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                         <p className="font-bold text-theme-body uppercase tracking-widest text-[10px] border-b border-theme pb-2">The Idea This Paper Tests</p>
                         <p className="text-theme-body opacity-80">Data could be used to track and identify pain points, finding efficient ways to convert a country's hidden wealth into a base for growth. Using machine learning to process billions of data points in real time points toward building a custom, end-to-end application.</p>
                      </div>
                      <div className="space-y-2">
                         <p className="font-bold text-theme-body uppercase tracking-widest text-[10px] border-b border-theme pb-2 mt-6">Reading Wealth from Alternate Signals</p>
                         <ul className="list-disc pl-4 space-y-2 text-[11px] text-theme-body opacity-80">
                           <li><strong>Satellites:</strong> A 2016 Stanford team demonstrated using nighttime light maps and daytime satellite imagery (recognizing paved roads, roof types) to explain up to 75% of local variation in economic outcomes without proprietary data.</li>
                           <li><strong>Mobile Phones:</strong> A UC Berkeley team used anonymized call detail records in Rwanda, finding that phone-derived estimates outperformed legacy 2007 government census surveys at a fraction of the cost.</li>
                           <li><strong>Global Synthesis:</strong> In 2022, the <em>Relative Wealth Index</em> combined satellite imagery, mobile network data, topographic data, and de-identified social connectivity signals to map wealth across 135 countries.</li>
                         </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                         <p className="font-bold text-theme-body uppercase tracking-widest text-[10px] border-b border-theme pb-2">Real-World Deployments</p>
                         <p className="text-theme-body opacity-80">Togo's Novissi cash transfer program is a prime example. Lacking an updated census during COVID-19, the government used the Relative Wealth Index to identify the 100 poorest cantons, then trained a machine learning model on phone data to rank individuals. According to a Nature study (2022), this machine-learning approach <strong>reduced exclusion errors by 8–14%</strong> relative to simple geographic targeting, reaching thousands of people who would have otherwise been missed, and improving targeting precision by 42% over a naive "target the poorest region" approach.</p>
                         <p className="mt-2 text-[11px] text-theme-muted italic">Other real-time monitoring infrastructure includes the WFP's HungerMap LIVE, tracking food security across 90+ countries using machine-learning "nowcasts".</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                         <p className="font-bold text-theme-body uppercase tracking-widest text-[10px] border-b border-theme pb-2">Ethical Constraints & Risks</p>
                         <ul className="list-disc pl-4 space-y-2 text-[11px] mb-4 text-theme-body opacity-80">
                           <li><strong>India's Aadhaar:</strong> The world's largest biometric identity system failed vulnerable populations (like the elderly or manual laborers) due to strict biometric threshold requirements and unreliable rural internet, excluding them actively from food and employment benefits.</li>
                           <li><strong>UNHCR & The Rohingya:</strong> In Bangladesh, humanitarian data collected from 830,000+ refugees was shared back with the Myanmar government (the regime they fled) through official institutional channels without transparent informed consent.</li>
                         </ul>
                      </div>
                      <div className="space-y-2">
                         <p className="font-bold text-theme-body uppercase tracking-widest text-[10px] border-b border-theme pb-2">An Implementation Path</p>
                         <p className="text-[11px] text-theme-body opacity-80">To mitigate these risks moving forward, researchers advocate for: 1) <strong>Federated data custody</strong> rather than a centralized vulnerability, 2) <strong>Privacy-preserving methods</strong> (like targeted differential noise applied directly to models), 3) <strong>Partnering</strong> with national statistics offices rather than replacing them, and 4) Designing guaranteed <strong>non-algorithmic appeal channels</strong> for individuals the models get wrong.</p>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </div>
    </div>
  );
}

function SliderControl({ 
  label, icon, value, onChange, helpText 
}: { 
  label: string, icon: React.ReactNode, value: number, onChange: (v: number) => void, helpText: string 
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs">
        <label className="flex items-center gap-1.5 text-theme-body font-medium">
          <span className="text-theme-muted">{icon}</span> 
          <span>{label}</span>
          <div 
            className="relative ml-0.5 cursor-help"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={(e) => {
               // Prevent slider interaction when tapping info
               e.preventDefault();
               setShowTooltip(!showTooltip);
            }}
          >
            <Info className="w-3.5 h-3.5 text-theme-muted opacity-70 hover:opacity-100 transition-opacity" />
            <AnimatePresence>
              {showTooltip && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-theme-base text-theme-body border border-theme text-[10px] shadow-xl rounded leading-tight pointer-events-none"
                >
                  {helpText}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </label>
        <span className="font-mono text-theme-body font-medium text-sm">
          {value.toFixed(1)}%
        </span>
      </div>
      {/* Touch target height wrapper for mobile */}
      <div className="flex items-center h-10 sm:h-6 -m-2 p-2 relative group cursor-pointer">
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full bg-transparent absolute inset-x-2 z-10 h-full [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(45,212,191,0)] group-hover:[&::-webkit-slider-thumb]:shadow-[0_0_0_6px_rgba(45,212,191,0.2)] opacity-0 sm:opacity-100" 
          // Hiding native thumb on mobile because we use a custom track fill anyway and touch target is large
          // Native thumb visible on desktop
          style={{ appearance: 'none', WebkitAppearance: 'none' }}
        />
        <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 border border-theme rounded-full overflow-hidden pointer-events-none relative z-0">
          <div 
            className="h-full bg-theme-accent transition-all duration-100" 
            style={{ width: `${value}%` }} 
          />
        </div>
        {/* Custom thumb strictly for visualization */}
        <div 
           className="w-4 h-4 bg-theme-accent rounded-full absolute pointer-events-none shadow-md z-[5] transition-transform duration-100 group-hover:scale-125"
           style={{ left: `calc(0.5rem + ${value}% * calc(100% - 1rem) / 100)`, transform: 'translateX(-50%)' }}
        />
      </div>
      <p className="text-[10px] text-theme-muted leading-tight mt-1 px-1">{helpText}</p>
    </div>
  );
}
