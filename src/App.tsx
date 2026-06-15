import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  BookOpen, 
  Search, 
  Moon, 
  Sun, 
  Layers, 
  Bookmark, 
  ArrowLeft, 
  ArrowRight, 
  Wifi, 
  WifiOff,  
  RotateCcw, 
  CheckSquare, 
  Square, 
  Home, 
  Book, 
  CheckCircle2, 
  Share2, 
  Check, 
  BookMarked,
  Info,
  Calendar,
  X,
  Compass,
  Shuffle,
  ShieldCheck,
  Instagram,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { STAGES, SECTIONS, getPointData, Point, Stage } from "./data/homeIdeas";

export default function App() {
  // --- UI STATES ---
  const [isDarkMode, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("malayalam_home_ideas_theme");
    return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  
  const [selectedStageId, setSelectedStageId] = useState<number>(1);
  const [activePointId, setActivePointId] = useState<number>(1);
  const [pointsPerPage, setPointsPerPage] = useState<number>(() => {
    const saved = localStorage.getItem("malayalam_home_ideas_points_per_page");
    return saved ? parseInt(saved, 10) : 8;
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pointSearchQuery, setPointSearchQuery] = useState<string>("");
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(!navigator.onLine);
  
  // --- USER PERSISTENT STORAGE (LOCALSTORAGE) ---
  // Checked checklist items per Point ID
  const [completedChecks, setCompletedChecks] = useState<Record<number, string[]>>(() => {
    const saved = localStorage.getItem("malayalam_home_ideas_completed_checks");
    return saved ? JSON.parse(saved) : {};
  });

  // Read points tracker
  const [readPoints, setReadPoints] = useState<number[]>(() => {
    const saved = localStorage.getItem("malayalam_home_ideas_read_points");
    return saved ? JSON.parse(saved) : [1];
  });

  // Bookmarked / Favorite points
  const [favoritedPoints, setFavoritedPoints] = useState<number[]>(() => {
    const saved = localStorage.getItem("malayalam_home_ideas_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  // --- SHOW / HIDE BOOKMARK PANEL ---
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<'stages' | 'favorites'>('stages');
  const [mobileCurrentView, setMobileCurrentView] = useState<'list' | 'reader'>('reader');
  const readerCardRef = useRef<HTMLDivElement | null>(null);

  // Smooth scroll to reader card on mobile when point changes
  useEffect(() => {
    if (window.innerWidth < 1024 && mobileCurrentView === 'reader') {
      readerCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activePointId, mobileCurrentView]);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("malayalam_home_ideas_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("malayalam_home_ideas_theme", "light");
    }
  }, [isDarkMode]);

  // Sync state to local storage updates
  useEffect(() => {
    localStorage.setItem("malayalam_home_ideas_completed_checks", JSON.stringify(completedChecks));
  }, [completedChecks]);

  useEffect(() => {
    localStorage.setItem("malayalam_home_ideas_read_points", JSON.stringify(readPoints));
  }, [readPoints]);

  useEffect(() => {
    localStorage.setItem("malayalam_home_ideas_favorites", JSON.stringify(favoritedPoints));
  }, [favoritedPoints]);

  useEffect(() => {
    localStorage.setItem("malayalam_home_ideas_points_per_page", String(pointsPerPage));
  }, [pointsPerPage]);

  // Auto-set selectedStageId when active point changes
  useEffect(() => {
    const activePoint = getPointData(activePointId);
    if (activePoint.stageId !== selectedStageId) {
      setSelectedStageId(activePoint.stageId);
    }
  }, [activePointId]);

  // --- DATA RESOLUTION ---
  const activePoint: Point = useMemo(() => {
    return getPointData(activePointId);
  }, [activePointId]);

  const activePointsToRender = useMemo(() => {
    const points: Point[] = [];
    const count = pointsPerPage;
    let startId = activePointId;
    if (startId + count - 1 > 2540) {
      startId = Math.max(1, 2540 - count + 1);
    }
    for (let i = 0; i < count; i++) {
      const currentId = startId + i;
      if (currentId <= 2540) {
        points.push(getPointData(currentId));
      }
    }
    return points;
  }, [activePointId, pointsPerPage]);

  const activeStage: Stage = useMemo(() => {
    return STAGES.find(s => s.id === selectedStageId) || STAGES[0];
  }, [selectedStageId]);

  // List of points dynamically generated for the active stage
  const currentStagePoints: Point[] = useMemo(() => {
    const points: Point[] = [];
    for (let i = activeStage.startPoint; i <= activeStage.endPoint; i++) {
      points.push(getPointData(i));
    }
    return points;
  }, [activeStage]);

  // Auto-scroll the active point into view when the activePointId changes
  useEffect(() => {
    const activeEl = document.getElementById(`point-btn-${activePointId}`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activePointId]);

  // Global search filtering across all 2500+ generated points
  const filteredPointsGlobal = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    
    // We search the first 1000 items dynamically for instant responsiveness
    // Since it's procedurally calculated, searching all 2540 is super fast
    const matches: Point[] = [];
    for (let i = 1; i <= 2540; i++) {
      const p = getPointData(i);
      const stageOfPoint = STAGES.find(s => i >= s.startPoint && i <= s.endPoint);
      if (
        p.titleEn.toLowerCase().includes(query) ||
        p.titleMl.toLowerCase().includes(query) ||
        p.descMl.toLowerCase().includes(query) ||
        p.id.toString().includes(query) ||
        (stageOfPoint && stageOfPoint.nameEn.toLowerCase().includes(query)) ||
        (stageOfPoint && stageOfPoint.nameMl.toLowerCase().includes(query))
      ) {
        matches.push(p);
      }
    }
    return matches;
  }, [searchQuery]);

  // Bookmark only filter list
  const favoritedPointsResolved = useMemo(() => {
    return favoritedPoints.map(id => getPointData(id));
  }, [favoritedPoints]);

  // --- ACTIONS ---
  const handleStageChange = (stageId: number) => {
    setSelectedStageId(stageId);
    const targetStage = STAGES.find(s => s.id === stageId) || STAGES[0];
    setActivePointId(targetStage.startPoint);
    setMobileCurrentView('reader');
  };

  const jumpToPoint = (pointNumStr: string) => {
    const num = parseInt(pointNumStr.replace(/\D/g, ""), 10);
    if (!isNaN(num) && num >= 1 && num <= 2540) {
      setActivePointId(num);
      setPointSearchQuery("");
      setSearchQuery("");
      setMobileCurrentView('reader');
    }
  };

  const handleNextPoint = () => {
    if (activePointId < 2540) {
      const nextId = activePointId + 1;
      setActivePointId(nextId);
      markAsRead(nextId);
      setMobileCurrentView('reader');
    }
  };

  const handlePrevPoint = () => {
    if (activePointId > 1) {
      const prevId = activePointId - 1;
      setActivePointId(prevId);
      markAsRead(prevId);
      setMobileCurrentView('reader');
    }
  };

  const toggleFavorite = (id: number) => {
    if (favoritedPoints.includes(id)) {
      setFavoritedPoints(prev => prev.filter(p => p !== id));
    } else {
      setFavoritedPoints(prev => [...prev, id]);
    }
  };

  const markAsRead = (id: number) => {
    if (!readPoints.includes(id)) {
      setReadPoints(prev => [...prev, id]);
    }
  };

  const handleChecklistToggle = (pointId: number, checkText: string) => {
    const currentPointChecks = completedChecks[pointId] || [];
    let updated: string[];
    if (currentPointChecks.includes(checkText)) {
      updated = currentPointChecks.filter(c => c !== checkText);
    } else {
      updated = [...currentPointChecks, checkText];
    }
    setCompletedChecks(prev => ({
      ...prev,
      [pointId]: updated
    }));
  };

  const handleRandomPoint = () => {
    const randomId = Math.floor(Math.random() * 2540) + 1;
    setActivePointId(randomId);
    markAsRead(randomId);
    setMobileCurrentView('reader');
  };

  const handleResetProgress = () => {
    setShowResetConfirm(true);
  };

  const confirmResetProgress = () => {
    setReadPoints([1]);
    setCompletedChecks({});
    setFavoritedPoints([]);
    setActivePointId(1);
    setSelectedStageId(1);
    setMobileCurrentView('reader');
    setShowResetConfirm(false);
  };

  // --- PROGRESS CALCULATIONS ---
  const totalReadCount = readPoints.length;
  const totalReadPercentage = Math.min(100, Math.round((totalReadCount / 2540) * 100));
  
  // Total checklist items checked globally
  const totalCheckedCount = (Object.values(completedChecks) as string[][]).reduce((acc, curr) => acc + curr.length, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0A0A0A] text-zinc-900 dark:text-[#E5E5E5] transition-all duration-300 font-sans pb-12">
      
      {/* --- PREMIUM GLOBAL HEADER --- */}
      <nav id="app-header" className="sticky top-0 z-40 bg-white/85 dark:bg-[#111111]/85 text-zinc-900 dark:text-white backdrop-blur-md border-b border-zinc-200 dark:border-[#202020] px-3 py-2 sm:px-6 sm:py-3 shadow-md shadow-zinc-100/50 dark:shadow-none">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2 md:gap-4">
          
          {/* Logo & Bilingual Banner */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-zinc-100 dark:bg-[#1A1A1A] text-[#0D9488] rounded-xl border border-zinc-200 dark:border-[#333333] shadow-md shadow-[#0D9488]/5 shrink-0">
              <Book className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-sm sm:text-xl font-bold tracking-tight font-display text-[#0D9488] whitespace-nowrap flex items-center gap-2">
                Building Tips 
                <span className="hidden lg:inline text-zinc-500 dark:text-[#A0A0A0] text-xs font-sans font-normal ml-2">| 2000+ Ideas By <a href="https://instagram.com/hamrasart" target="_blank" rel="noopener noreferrer" className="hover:underline text-[#0D9488] font-semibold">Hamras Mohamed</a></span>
              </h1>
              <p className="text-[9px] -mt-0.5 text-zinc-400 dark:text-zinc-500 font-medium tracking-wide uppercase font-mono hidden sm:block">
                ★ 100% Standalone Offline Edition
              </p>
            </div>
          </div>

          {/* Configuration Toggles */}
          <div className="flex items-center gap-1.5 sm:gap-3 justify-end shrink-0">
            
            {/* Theme Toggle */}
            <button 
              id="theme-toggle"
              onClick={() => setIsDark(!isDarkMode)}
              className="p-1.5 px-2.5 text-[10px] sm:text-xs sm:p-2 sm:px-3 rounded-xl bg-zinc-100 dark:bg-[#1A1A1A] hover:bg-zinc-200 dark:hover:bg-[#252525] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-[#333333] transition-all font-bold flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
              title="തീം മാറ്റുക"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-[#0D9488]" /> : <Moon className="w-3.5 h-3.5 text-zinc-400" />}
              <span className="hidden sm:inline">തീം മാറ്റുക</span>
            </button>

            {/* Reset Progress */}
            <button 
              onClick={handleResetProgress}
              className="p-1.5 px-2.5 text-[10px] sm:text-xs sm:p-2 sm:px-3 rounded-xl bg-rose-500/10 dark:bg-[#201016] hover:bg-rose-500/20 dark:hover:bg-[#301622] text-rose-600 dark:text-rose-400 border border-rose-200/30 dark:border-[#4B1A2A] transition-all font-bold flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-xs"
              title="പുരോഗതി റീസെറ്റ് ചെയ്യുക"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">റീസെറ്റ്</span>
            </button>

            {/* Offline Sync State Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] sm:text-xs font-bold border transition-colors ${
              isOfflineMode 
                ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                : "bg-emerald-500/10 border-emerald-500/20 text-[#00A86B]"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isOfflineMode ? "bg-amber-500" : "bg-emerald-400"}`} />
              <span className="hidden xs:inline">{isOfflineMode ? "ഓഫ്‌ലൈൻ" : "ഓൺലൈൻ"}</span>
              <span className="text-[9px] font-normal text-zinc-400 hidden md:inline ml-1">| Standalone</span>
            </div>
          </div>

         </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        
        <section id="control-bar" className="bg-white dark:bg-[#111111] p-4 sm:p-5 rounded-3xl border border-zinc-200 dark:border-[#262626] mb-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-end shadow-sm animate-fade-in font-sans">
          
          {/* Number-wise Specific Point Search or Random selector button */}
          <div className="md:col-span-5 flex flex-col gap-1.5 w-full font-sans">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-450 dark:text-[#888888] flex items-center gap-1 font-display">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
              <span>പോയിന്റ് സെർച്ച് / യാദൃശ്ചികം</span>
            </label>
            <div className="relative flex gap-2 w-full">
              <div className="relative flex-1">
                <input
                  id="number-search"
                  type="text"
                  placeholder="Ex: 142..."
                  value={pointSearchQuery}
                  onChange={(e) => setPointSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && jumpToPoint(pointSearchQuery)}
                  className="w-full bg-zinc-50 dark:bg-[#1A1A1A] py-2.5 pl-3 pr-11 rounded-xl border border-zinc-250 dark:border-[#333333] text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white focus:border-[#0D9488] focus:outline-none transition-all"
                />
                <button 
                  onClick={() => jumpToPoint(pointSearchQuery)}
                  className="absolute right-1 top-1 bottom-1 px-3.5 bg-[#0D9488] hover:bg-[#0D8578] text-white font-bold rounded-lg text-xs cursor-pointer active:scale-95 transition-all"
                >
                  Go
                </button>
              </div>
              <button
                onClick={handleRandomPoint}
                className="p-2.5 bg-zinc-50 dark:bg-[#1A1A1A] hover:bg-zinc-100 dark:hover:bg-[#252525] text-[#0D9488] border border-zinc-200 dark:border-[#333333] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95"
                title="യാദൃശ്ചിക പോയിന്റ് കണ്ടെത്തുക (Random Idea)"
              >
                <Shuffle className="w-4 h-4 text-[#0D9488]" />
                <span className="inline sm:hidden md:inline lg:hidden xl:inline font-sans">Random</span>
              </button>
            </div>
          </div>

          {/* User-friendly General Concept Search Bar */}
          <div className="md:col-span-7 flex flex-col gap-1.5 w-full font-sans">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-450 dark:text-[#888888] flex items-center gap-1.5 font-display">
              <Search className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>തിരയുക (Search Concepts)</span>
            </label>
            <div className="relative">
              <input
                id="concept-search"
                type="text"
                placeholder="കോൺക്രീറ്റ്, പ്ലോട്ടിങ്, Vastu, Kitchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#1A1A1A] py-2.5 pl-10 pr-10 rounded-xl border border-zinc-250 dark:border-[#333333] text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white focus:border-[#0D9488] focus:outline-none transition-all"
              />
              <Search className="absolute left-3.5 top-3.5 text-zinc-400 dark:text-[#888888] w-4 h-4" />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3.5 text-zinc-400 dark:text-[#888888] hover:text-rose-500 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </section>

        {/* --- BOOKMARKS AND GLOBAL SEARCH RESULTS LISTS --- */}
        <AnimatePresence>
          {searchQuery && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-[#111111] border-2 border-[#0D9488]/30 dark:border-[#0D9488]/30 p-4 sm:p-5 rounded-3xl mb-6 shadow-sm"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-100 dark:border-[#262626]">
                <h3 className="font-extrabold text-sm text-[#0D9488] flex items-center gap-2 font-display">
                  <span className="px-2 py-0.5 rounded-full bg-[#0D9488]/10 text-xs text-[#0D9488]">Search Results</span>
                  <span>ഫലങ്ങൾ for &quot;{searchQuery}&quot;: {filteredPointsGlobal?.length || 0} എണ്ണം കണ്ടെത്തി</span>
                </h3>
                <button 
                  onClick={() => setSearchQuery("")}
                  className="px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-[#1A1A1A] border border-zinc-200 dark:border-[#333333] hover:bg-zinc-100 dark:hover:bg-[#252525] text-[#0D9488] text-xs font-semibold cursor-pointer transition-colors"
                >
                  ക്ലിയർ സെർച്ച്
                </button>
              </div>

              {filteredPointsGlobal && filteredPointsGlobal.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto font-sans">
                  {filteredPointsGlobal.map(p => (
                    <button
                       key={p.id}
                       onClick={() => {
                         setActivePointId(p.id);
                         setSearchQuery("");
                       }}
                       className="text-left p-3 rounded-xl bg-zinc-50 dark:bg-[#1A1A1A] border border-zinc-150 dark:border-[#262626] hover:border-[#0D9488] transition-all flex items-start gap-3 cursor-pointer shadow-xs group"
                    >
                      <span className="font-mono text-xs font-bold text-[#0D9488] bg-white dark:bg-[#222222] border border-zinc-200 dark:border-[#333333] p-2 rounded-lg group-hover:scale-105 transition-transform flex-shrink-0">
                        {String(p.id).padStart(4, "0")}
                      </span>
                      <div className="overflow-hidden min-w-0">
                        <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight truncate">{p.titleEn}</div>
                        <div className="text-sm font-extrabold text-zinc-800 dark:text-[#E5E5E5] font-serif-ml truncate">{p.titleMl}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-zinc-500 dark:text-[#888888] font-medium font-serif-ml">
                  ഈ വിവരത്തിന് അനുസൃതമായ പോയിന്റുകൾ ലഭ്യമല്ല. മറ്റൊരു വാക്ക് ഉപയോഗിച്ച് തിരയുക.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Feed Section */}
        <section className="w-full">
          <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#262626] rounded-3xl p-4 sm:p-6 shadow-sm">
            {/* Stages List Dropdown & Single Master Card Header */}
            <div className="flex flex-col gap-4 pb-4 border-b border-zinc-150 dark:border-[#262626] mb-6">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 dark:text-[#888888] flex items-center gap-1.5 font-display">
                  <Layers className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span>നിർമ്മാണ ഘട്ടം തിരഞ്ഞെടുക്കുക (Select Stage)</span>
                </label>
                <div className="relative">
                  <select
                    id="stage-dropdown"
                    value={selectedStageId}
                    onChange={(e) => handleStageChange(parseInt(e.target.value, 10))}
                    className="w-full bg-zinc-50 dark:bg-[#1A1A1A] py-2.5 sm:py-3.5 px-3.5 sm:px-4.5 rounded-xl border border-zinc-200 dark:border-[#333333] text-xs sm:text-sm font-bold text-zinc-800 dark:text-white transition-colors focus:border-[#0D9488] focus:outline-none appearance-none cursor-pointer font-sans"
                  >
                    {SECTIONS.map(section => (
                      <optgroup key={section} label={section} className="text-[#0D9488] font-bold bg-white dark:bg-[#111111] py-1 text-xs font-sans">
                        {STAGES.filter(s => s.section === section).map(stage => (
                          <option key={stage.id} value={stage.id} className="text-zinc-800 dark:text-white bg-white dark:bg-[#111111] font-medium py-1 font-sans">
                            Stage {stage.id}: {stage.nameMl} ({stage.nameEn})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-500 dark:text-zinc-450">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Sibling stages quick select carousel list inside current chapter */}
              <div className="flex flex-col gap-2">
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 dark:text-[#888888]">
                  Quick Navigation (Chapter Stages)
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-teal-500/20">
                  {STAGES.filter(s => s.section === activeStage.section).map(s => {
                    const isCurrent = s.id === selectedStageId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleStageChange(s.id)}
                        className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer font-sans ${
                          isCurrent
                            ? "bg-[#0D9488] text-white shadow-xs"
                            : "bg-zinc-50 dark:bg-[#1A1A1A] hover:bg-zinc-100 dark:hover:bg-[#252525] text-zinc-650 dark:text-zinc-400 border border-zinc-200 dark:border-[#2b2b2b]"
                        }`}
                      >
                        Stage {s.id}: {s.nameMl}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 font-display">
                  <span className="text-xs text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 font-extrabold truncate font-sans">
                    {activeStage.nameMl} &mdash; {activeStage.section}
                  </span>
                </div>
                <div className="text-xs text-[#0D9488] font-extrabold font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse"></span>
                  <span>Points: {activePointsToRender[0] ? String(activePointsToRender[0].id).padStart(4, "0") : ""} &ndash; {activePointsToRender[activePointsToRender.length - 1] ? String(activePointsToRender[activePointsToRender.length - 1].id).padStart(4, "0") : ""}</span>
                </div>
              </div>
            </div>

            {/* Previous and Next Points Navigation Buttons bar (Top) with Page Size Selection */}
            <div className="flex items-center justify-between gap-2.5 p-2 bg-zinc-50 dark:bg-[#1A1A1A] border border-zinc-200 dark:border-[#262626] rounded-2xl shadow-xs mb-6 font-sans">
              <button
                disabled={activePointId <= 1}
                onClick={() => {
                  const prevId = Math.max(1, activePointId - pointsPerPage);
                  setActivePointId(prevId);
                  markAsRead(prevId);
                  if (readerCardRef.current) {
                    readerCardRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#222222] hover:bg-zinc-100 dark:hover:bg-[#2d2d2d] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-[#333333] rounded-xl flex items-center justify-center gap-1.5 transition-all font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group min-w-0"
              >
                <ChevronLeft className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                <span className="truncate font-sans text-xs">Prev<span className="hidden sm:inline"> Points</span></span>
              </button>

              {/* Page count selector dropdown */}
              <div className="shrink-0 relative flex items-center bg-white dark:bg-[#222222] border border-zinc-200 dark:border-[#333333] rounded-xl px-2 sm:px-3 py-2.5 sm:py-3 cursor-pointer select-none">
                <select
                  value={pointsPerPage}
                  onChange={(e) => {
                    const newCount = parseInt(e.target.value, 10);
                    setPointsPerPage(newCount);
                    // Adjust point selection if we are near the end
                    if (activePointId > 2540 - newCount + 1) {
                      setActivePointId(Math.max(1, 2540 - newCount + 1));
                    }
                  }}
                  className="bg-transparent text-xs sm:text-sm font-bold text-zinc-700 dark:text-[#0D9488] focus:outline-none appearance-none pr-5 cursor-pointer text-center font-sans"
                >
                  <option value={4} className="bg-white dark:bg-[#222222] text-zinc-800 dark:text-white font-sans">4 / Pg</option>
                  <option value={8} className="bg-white dark:bg-[#222222] text-zinc-800 dark:text-white font-sans">8 / Pg</option>
                  <option value={12} className="bg-white dark:bg-[#222222] text-zinc-800 dark:text-white font-sans">12 / Pg</option>
                  <option value={16} className="bg-white dark:bg-[#222222] text-zinc-800 dark:text-white font-sans">16 / Pg</option>
                  <option value={20} className="bg-white dark:bg-[#222222] text-zinc-800 dark:text-white font-sans">20 / Pg</option>
                  <option value={24} className="bg-white dark:bg-[#222222] text-zinc-800 dark:text-white font-sans">24 / Pg</option>
                  <option value={32} className="bg-white dark:bg-[#222222] text-zinc-800 dark:text-white font-sans">32 / Pg</option>
                </select>
                <div className="pointer-events-none absolute right-1.5 sm:right-2.5 text-[#0D9488]">
                  <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              <button
                disabled={activePointId >= 2540 - pointsPerPage + 1}
                onClick={() => {
                  const nextId = Math.min(2540 - pointsPerPage + 1, activePointId + pointsPerPage);
                  setActivePointId(nextId);
                  markAsRead(nextId);
                  if (readerCardRef.current) {
                    readerCardRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0D9488] hover:bg-[#0D8578] text-white rounded-xl flex items-center justify-center gap-1.5 transition-all font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group shadow-xs min-w-0"
              >
                <span className="truncate font-sans text-xs text-white">Next<span className="hidden sm:inline"> Points</span></span>
                <ChevronRight className="w-4 h-4 shrink-0 text-white transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            {/* Combined list of sub-points inside this single card */}
            <div className="space-y-6">
              {activePointsToRender.map((p, index) => {
                const isMiddle = index === Math.floor(activePointsToRender.length / 2);
                return (
                  <React.Fragment key={p.id}>
                    {isMiddle && (
                      <div className="p-5 sm:p-6 rounded-3xl bg-zinc-50 dark:bg-[#1A1A1A] border border-zinc-200 dark:border-[#262626] my-5 shadow-sm text-zinc-805 dark:text-[#E2E8F0] relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-2.5 font-sans">
                          <span className="text-xs font-extrabold text-[#0D9488] tracking-wider uppercase flex items-center gap-1 font-display">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
                            <span>HAD Architecture</span>
                          </span>
                          <span className="text-[10px] bg-[#0D9488]/10 text-[#0D9488] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 font-mono border border-[#0D9488]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
                            ONLINE CONSULTANCY
                          </span>
                        </div>
                        <p className="text-xs sm:text-xs text-zinc-650 dark:text-zinc-300 font-serif-ml leading-relaxed mb-4">
                           കേരളത്തിലെ വീട് നിർമ്മാണം സിമ്പിൾ ആക്കാം! പ്ലാൻ, എൽവേഷൻ, Construction, Supervision, ഇന്റീരിയർ വർക്കുകൾക്കായി ബന്ധപ്പെടുക.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2.5 font-sans">
                          <a
                            href="https://wa.me/917907383944?text=Hi%20HAD%20Architecture,%20I%20am%20using%20the%20Malayalam%20Home%20Planner%20app%20and%20would%20like%20to%20discuss%20building/interior%20consultancy."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2.5 bg-[#0D9488] hover:bg-[#0D8578] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] inline-flex align-middle"
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>WhatsApp Chat</span>
                          </a>
                          <a
                            href="https://instagram.com/hamrasart"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2.5 bg-white dark:bg-[#222222] hover:bg-zinc-100 dark:hover:bg-[#2a2a2a] text-zinc-700 dark:text-zinc-200 text-xs font-bold border border-zinc-200 dark:border-[#333333] flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] inline-flex align-middle"
                          >
                            <Instagram className="w-3.5 h-3.5 shrink-0 text-pink-500" />
                            <span>Instagram Feed</span>
                          </a>
                        </div>
                      </div>
                    )}

                    <div 
                      id={`reader-point-${p.id}`}
                      className="p-5 sm:p-6 rounded-3xl border transition-all duration-300 text-left relative bg-zinc-50/30 dark:bg-[#1A1A1A]/30 border-zinc-150 dark:border-[#262626] hover:border-[#0D9488] hover:shadow-sm"
                    >
                      {/* Point header inside the sub-point row */}
                      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 dark:border-[#262626] pb-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="px-2.5 py-1.5 border rounded-xl font-mono text-xs font-bold shrink-0 transition-colors bg-[#0D9488]/10 border-[#0D9488]/20 text-[#0D9488]">
                            {String(p.id).padStart(4, "0")}
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-serif-ml leading-snug">
                              {p.titleMl}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-550 uppercase tracking-wider font-extrabold font-display">
                              {p.titleEn}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => toggleFavorite(p.id)}
                            className={`p-1.5 rounded-lg border transition-all active:scale-95 cursor-pointer ${
                              favoritedPoints.includes(p.id)
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                : "bg-zinc-50 dark:bg-[#222222] border-zinc-200 dark:border-[#333333] text-zinc-400 dark:text-zinc-500 hover:text-[#0D9488]"
                            }`}
                            title="പ്രിയപ്പെട്ട ലേബൽ"
                          >
                            <Bookmark className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </div>

                      {/* Malayalam Details & Checklist */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left: Desc */}
                        <div className="p-4 bg-white dark:bg-[#151515] rounded-2xl border border-zinc-150 dark:border-[#262626] shadow-xs hover:shadow-sm transition-shadow">
                          <p className="text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-300 font-serif-ml leading-loose">
                            {p.descMl}
                          </p>
                        </div>

                        {/* Right: Checklist */}
                        <div className="p-4 bg-white dark:bg-[#151515]/80 rounded-2xl border border-zinc-150 dark:border-[#262626]" onClick={(e) => e.stopPropagation()}>
                          {(() => {
                            const pChecklist = p.checklist || [
                              "പ്രവർത്തനം മനസ്സിലാക്കി പ്ലാൻ ചെയ്യുക",
                              "ശരിയായ സാധനങ്ങൾ ഗുണനിലവാരത്തോടെ തിരഞ്ഞെടുക്കുക",
                              "വിദഗ്ദ്ധ തൊഴിലാളികളുടെ മേൽനോട്ടം ഉറപ്പ് വരുത്തുക"
                            ];
                            const completedList = completedChecks[p.id] || [];
                            const isCompletedAll = completedList.length === pChecklist.length;
                            return (
                              <>
                                <h4 className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 mb-3 font-display flex items-center justify-between">
                                  <span>Checklist ({completedList.length} / {pChecklist.length})</span>
                                  {isCompletedAll && (
                                    <span className="text-[9px] bg-[#0D9488]/20 border border-[#0D9488]/30 text-[#0D9488] font-extrabold px-2 py-0.5 rounded-lg tracking-normal font-sans">COMPLETED ✓</span>
                                  )}
                                </h4>
                                <div className="space-y-2">
                                  {pChecklist.map((check, idx) => {
                                    const isChecked = completedList.includes(check);
                                    return (
                                      <button
                                        key={idx}
                                        onClick={() => handleChecklistToggle(p.id, check)}
                                        className={`w-full text-left p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer text-xs ${
                                          isChecked
                                            ? "bg-[#0D9488]/10 dark:bg-[#0D9488]/5 border-[#0D9488]/20 text-[#0D9488]"
                                            : "bg-zinc-50/50 dark:bg-[#222222]/40 border-zinc-100 dark:border-[#333333] text-zinc-655 dark:text-zinc-400"
                                        }`}
                                      >
                                        <div className="shrink-0 animate-fade-in">
                                          {isChecked ? (
                                            <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                                          ) : (
                                            <div className="w-4 h-4 rounded-md border border-zinc-300 dark:border-[#444444]" />
                                          )}
                                        </div>
                                        <span className="text-[11px] font-extrabold leading-relaxed">{check}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Previous and Next Points Navigation Buttons bar with Page Size Selection */}
            <div className="flex items-center justify-between gap-2.5 p-2 bg-slate-50 dark:bg-[#070B12] border border-slate-200 dark:border-[#1B2B3F] rounded-2xl shadow-sm mt-6">
              <button
                disabled={activePointId <= 1}
                onClick={() => {
                  const prevId = Math.max(1, activePointId - pointsPerPage);
                  setActivePointId(prevId);
                  markAsRead(prevId);
                  if (readerCardRef.current) {
                    readerCardRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#102033] hover:bg-slate-100 dark:hover:bg-[#162C46] text-slate-705 dark:text-slate-200 border border-slate-200 dark:border-[#1E3654] rounded-xl flex items-center justify-center gap-1.5 transition-all font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group min-w-0"
              >
                <ChevronLeft className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                <span className="truncate">Prev<span className="hidden sm:inline"> Points</span></span>
              </button>

              {/* Page count selector dropdown */}
              <div className="shrink-0 relative flex items-center bg-white dark:bg-[#102033] border border-slate-200 dark:border-[#1E3654] rounded-xl px-2 sm:px-3 py-2.5 sm:py-3 cursor-pointer select-none">
                <select
                  value={pointsPerPage}
                  onChange={(e) => {
                    const newCount = parseInt(e.target.value, 10);
                    setPointsPerPage(newCount);
                    // Adjust point selection if we are near the end
                    if (activePointId > 2540 - newCount + 1) {
                      setActivePointId(Math.max(1, 2540 - newCount + 1));
                    }
                  }}
                  className="bg-transparent text-xs sm:text-sm font-bold text-slate-750 dark:text-[#2DD4BF] focus:outline-none appearance-none pr-5 cursor-pointer text-center"
                >
                  <option value={4} className="bg-white dark:bg-[#0C1322] text-slate-800 dark:text-white">4 / Pg</option>
                  <option value={8} className="bg-white dark:bg-[#0C1322] text-slate-800 dark:text-white">8 / Pg</option>
                  <option value={12} className="bg-white dark:bg-[#0C1322] text-slate-800 dark:text-white">12 / Pg</option>
                  <option value={16} className="bg-white dark:bg-[#0C1322] text-slate-800 dark:text-white">16 / Pg</option>
                  <option value={20} className="bg-white dark:bg-[#0C1322] text-slate-800 dark:text-white">20 / Pg</option>
                  <option value={24} className="bg-white dark:bg-[#0C1322] text-slate-800 dark:text-white">24 / Pg</option>
                  <option value={32} className="bg-white dark:bg-[#0C1322] text-slate-800 dark:text-white">32 / Pg</option>
                </select>
                <div className="pointer-events-none absolute right-1.5 sm:right-2.5 text-teal-650 dark:text-[#2DD4BF]">
                  <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              <button
                disabled={activePointId >= 2540 - pointsPerPage + 1}
                onClick={() => {
                  const nextId = Math.min(2540 - pointsPerPage + 1, activePointId + pointsPerPage);
                  setActivePointId(nextId);
                  markAsRead(nextId);
                  if (readerCardRef.current) {
                    readerCardRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-550 hover:to-emerald-450 text-white rounded-xl flex items-center justify-center gap-1.5 transition-all font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group shadow-sm min-w-0"
              >
                <span className="truncate">Next<span className="hidden sm:inline"> Points</span></span>
                <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </section>

          <AnimatePresence>
            {showBookmarksOnly && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white dark:bg-[#111111] border-2 border-[#0D9488]/40 p-4 rounded-2xl mt-6 shadow-sm"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm text-[#0D9488]">
                    പ്രിയപ്പെട്ട വിവരങ്ങളുടെ ലിസ്റ്റ് (Bookmarks): {favoritedPointsResolved.length} എണ്ണം
                  </h3>
                  <button 
                    onClick={() => setShowBookmarksOnly(false)}
                    className="px-3 py-1 rounded-lg bg-zinc-100 dark:bg-[#1A1A1A] border border-zinc-200 dark:border-[#262626] hover:bg-zinc-200 dark:hover:bg-[#222] text-[#0D9488] text-xs font-semibold cursor-pointer"
                  >
                    ക്ലോസ് ചെയ്യുക
                  </button>
                </div>

                {favoritedPointsResolved.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto w-full">
                    {favoritedPointsResolved.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setActivePointId(p.id);
                          setShowBookmarksOnly(false);
                          if (readerCardRef.current) {
                            readerCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className="text-left p-3 rounded-xl bg-zinc-50 dark:bg-[#1A1A1A] border border-zinc-200 dark:border-[#262626] hover:border-[#0D9488]/70 transition-all flex items-start gap-3 cursor-pointer shadow-sm group w-full min-w-0"
                      >
                        <span className="font-mono text-xs font-bold text-[#0D9488] bg-zinc-100 dark:bg-[#222] border border-zinc-200 dark:border-[#333333] p-2 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                          {String(p.id).padStart(4, "0")}
                        </span>
                        <div className="overflow-hidden min-w-0 flex-1">
                          <div className="text-xs font-semibold text-zinc-500 dark:text-[#A0A0A0] truncate">{p.titleEn}</div>
                          <div className="text-sm font-bold text-zinc-900 dark:text-white font-serif-ml truncate">{p.titleMl}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-[#A0A0A0]">
                    നിങ്ങൾ ഇതുവരെ പ്രിയപ്പെട്ട കാര്യങ്ങളൊന്നും തിരഞ്ഞെടുത്തിട്ടില്ല.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        {/* --- DYNAMIC STATS BENTO ROW (Read, Checked, Saved, Progress cards - BELOW) --- */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 w-full mt-6">
          <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-zinc-200 dark:border-[#262626] hover:border-[#0D9488]/20 flex items-center gap-3.5 shadow-xs min-w-0 transition-all duration-300 font-sans">
            <div className="p-2.5 bg-zinc-50 dark:bg-[#222222] border border-zinc-200 dark:border-[#333333] text-[#0D9488] shrink-0 rounded-xl">
              <BookMarked className="w-5 h-5 text-[#0D9488]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold font-mono text-zinc-900 dark:text-white truncate">{totalReadCount} / 2540</div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold tracking-wide uppercase truncate">വായിച്ചവ (Read)</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-zinc-200 dark:border-[#262626] hover:border-[#0D9488]/20 flex items-center gap-3.5 shadow-xs min-w-0 transition-all duration-300 font-sans">
            <div className="p-2.5 bg-zinc-50 dark:bg-[#222222] border border-zinc-200 dark:border-[#333333] text-[#0D9488] shrink-0 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-[#0D9488]" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold font-mono text-zinc-900 dark:text-white truncate">{totalCheckedCount}</div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold tracking-wide uppercase truncate">ചെയ്തവ (Checked)</div>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className="text-left bg-white dark:bg-[#1A1A1A] hover:bg-zinc-50 dark:hover:bg-[#222222] p-4 rounded-2xl border border-zinc-200 dark:border-[#262626] hover:border-amber-500/30 flex items-center gap-3.5 shadow-xs min-w-0 cursor-pointer transition-all active:scale-95 duration-300 font-sans"
          >
            <div className="p-2.5 bg-zinc-50 dark:bg-[#222222] border border-zinc-200 dark:border-[#333333] text-amber-500 shrink-0 rounded-xl">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold font-mono text-zinc-900 dark:text-white truncate">{favoritedPoints.length}</div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold tracking-wide uppercase truncate flex items-center gap-1">
                <span>സേവ്ഡ് (Saved)</span>
                <span className="text-[10px] text-amber-500 animate-pulse">★</span>
              </div>
            </div>
          </button>

          <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl border border-zinc-200 dark:border-[#262626] hover:border-[#0D9488]/20 flex items-center gap-3.5 shadow-xs min-w-0 transition-all duration-300 font-sans">
            <div className="p-2.5 bg-zinc-50 dark:bg-[#222222] border border-zinc-200 dark:border-[#333333] text-indigo-500 shrink-0 rounded-xl">
              <Compass className="w-5 h-5 text-indigo-505" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold font-mono text-zinc-900 dark:text-white truncate">{totalReadPercentage}%</div>
              <div className="text-[9px] sm:text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold tracking-wide uppercase truncate">പുരോഗതി (Progress)</div>
            </div>
          </div>
        </section>

        {/* --- DYNAMIC STAGE INFORMATION DESCRIPTION COMPASS GRID --- */}
        <section id="stage-details-dashboard" className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8">
          
          {/* Detailed building guide helper (8 Cols) */}
          <div className="md:col-span-8 bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-[#262626] rounded-3xl p-6 shadow-xs flex flex-col justify-between font-sans">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-1.5 font-serif-ml">
                <Compass className="w-5 h-5 text-[#0D9488]" />
                <span>ഈ നിർമ്മാണ ഘട്ടത്തെക്കുറിച്ച് (All About Stage {activeStage.id})</span>
              </h3>
              <p className="text-sm text-zinc-705 dark:text-zinc-305 font-serif-ml leading-relaxed leading-loose mb-4">
                ഈ ഘട്ടത്തിൽ ({activeStage.nameMl}) കെട്ടിട നിർമ്മാണത്തിന് പ്രധാനമായും വേണ്ട രേഖകളും അടിത്തറയുടെ പ്രാധാന്യവും മനസ്സിലാക്കേണ്ടതാണ്. പോയിന്റ് {activeStage.startPoint} മുതൽ പോയിന്റ് {activeStage.endPoint} വരെയുള്ള ക്രമീകരണങ്ങളാണ് ഇതിൽ ഉൾക്കൊള്ളുന്നത്. ഈ ഘട്ടങ്ങളിലെ വായന പുരോഗതി 100% എത്തിക്കാൻ പോയിന്റുകൾ വായിച്ചു നോക്കുക.
              </p>
              
              {/* We hide the old description elements cleanly */}
              <div className="hidden">
                <h4 className="text-base font-bold mb-2">ഓഫ്‌ലൈൻ വായനയുടെ നിർദ്ദേശങ്ങൾ</h4>
                <p className="text-xs text-zinc-800 dark:text-[#CCCCCC] leading-relaxed leading-loose font-serif-ml">
                  നിങ്ങൾ വായിക്കുന്ന എല്ലാ വിവരങ്ങളും സ്വയംപ്രേരിതമായി നിങ്ങളുടെ ഫോണിൽ വായന പുരോഗതിക്കൊപ്പം സേവ് ചെയ്യപ്പെടും. ഭാവിയിൽ പണി നടക്കുമ്പോൾ ഇന്റർനെറ്റ് ഇല്ലെങ്കിലും നിങ്ങൾക്ക് ഈ വിവരങ്ങൾ എളുപ്പത്തിൽ ആക്സസ് ചെയ്യാവുന്നതാണ്. 
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-250 dark:border-[#262626]">
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-extrabold tracking-wider font-display">Malayalam Home Planner • Standalone Edition</div>
            </div>
          </div>

          {/* EXPERT BUILDING CONSULTANCY COMPONENT FOR KERALA HOMES (4 COLS) */}
          <div className="md:col-span-4 bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-[#262626] rounded-3xl p-5 shadow-xs text-zinc-805 dark:text-white relative overflow-hidden group flex flex-col justify-between font-sans">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest font-mono">
                    ONLINE CONSULTANCY
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-500 font-mono">HAD ART</span>
              </div>

              <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white mb-2 leading-snug">
                HAD Architecture
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-serif-ml mb-4 leading-loose">
                കേരളത്തിലെ വീട് നിർമ്മാണം സിമ്പിൾ ആക്കാം! പ്ലാൻ, എൽവേഷൻ, Construction, Supervision, ഇന്റീരിയർ വർക്കുകൾക്കായി ബന്ധപ്പെടുക.
              </p>

              {/* Quick Contact Grid */}
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href="tel:+917907383944" 
                  className="bg-zinc-50 dark:bg-[#222222] border border-zinc-200 dark:border-[#333333] hover:border-[#0D9488]/50 p-2.5 rounded-xl flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <div className="p-1.5 bg-[#0D9488]/10 text-[#0D9488] rounded-lg shrink-0">
                    <Phone className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="block text-[8px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">CONTACT</span>
                    <span className="block text-[11px] sm:text-xs font-black text-zinc-800 dark:text-white tracking-wide truncate">7907383944</span>
                  </div>
                </a>

                <a 
                  href="https://instagram.com/hamrasart" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-zinc-50 dark:bg-[#222222] border border-zinc-200 dark:border-[#333333] hover:border-pink-500/50 p-2.5 rounded-xl flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <div className="p-1.5 bg-pink-500/10 text-[#F06292] rounded-lg shrink-0">
                    <Instagram className="w-3.5 h-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="block text-[8px] font-bold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase">INSTAGRAM</span>
                    <span className="block text-[11px] sm:text-xs font-black text-zinc-800 dark:text-white tracking-wide truncate">hamrasart</span>
                  </div>
                </a>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <a 
                  href="https://wa.me/917907383944?text=Hi%20HAD%20Architecture,%20I%20am%20using%20the%20Malayalam%20Home%20Planner%20app%20and%20would%20like%20to%20discuss%20building/interior%2520consultancy."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#0D9488] hover:bg-[#0D8578] text-white text-xs sm:text-sm font-black py-3 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer inline-flex align-middle"
                >
                  <MessageCircle className="w-4 h-4 shrink-0 text-white fill-current animate-pulse font-sans" />
                  <span>WhatsApp HAD Architecture</span>
                </a>

                <a 
                  href="https://wa.me/c/919895448946"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-zinc-800 dark:bg-[#333333] hover:bg-zinc-700 dark:hover:bg-[#444444] text-white text-xs sm:text-sm font-black py-3 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer inline-flex align-middle"
                >
                  <span className="text-sm shrink-0 font-sans">🎁</span>
                  <span>Other products by hadkart</span>
                </a>
              </div>
            </div>

            {/* Footer / Highlights Tag */}
            <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-[#333333] text-center text-[9px] font-bold font-mono text-zinc-400 dark:text-zinc-550 select-none uppercase tracking-tight">
              Kerala-Specific Spatial Plans • Layouts • 3D Renderings
            </div>
          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="mt-16 py-8 border-t border-zinc-200 dark:border-[#262626] text-center text-xs text-zinc-405 dark:text-zinc-505 font-sans">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-serif-ml">കൂടുതൽ വീട് നിർമ്മാണ അറിവുകൾക്കായി Building Tips ആപ്പ് സുഖകരമാക്കുക.</p>
          <p className="mt-1 font-mono text-[10px]">© 2026 Building Tips Planner. Crafted fully standalone.</p>
        </div>
      </footer>

      {/* RESET PROGRESS CONFIRMATION MODAL */}
      <AnimatePresence>
        {showResetConfirm && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowResetConfirm(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-[#262626] rounded-2xl max-w-md w-full p-6 shadow-2xl text-zinc-900 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold font-display text-[#0D9488] flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span>തീരുമാനം ഉറപ്പാക്കുക (Reset Confirmation)</span>
              </h3>
              
              <p className="mt-3 text-sm text-zinc-600 dark:text-[#A0A0A0] font-sans leading-relaxed">
                നിങ്ങളുടെ എല്ലാ വായന പുരോഗതിയും പൂർത്തിയാക്കിയ ലിസ്റ്റും പ്രിയപ്പെട്ട സേവനങ്ങളും റീസെറ്റ് ചെയ്ത് പൂജ്യത്തിൽ നിന്ന് തുടങ്ങാൻ താല്പര്യപ്പെടുന്നുണ്ടോ?
              </p>
              <p className="mt-2 text-xs text-rose-500 font-semibold font-mono">
                (This operation clears all checklist achievements, read percentages, and bookmarks).
              </p>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-zinc-500 dark:text-[#A0A0A0] hover:bg-zinc-100 dark:hover:bg-[#1C1C1C] transition-all cursor-pointer"
                >
                  വേണ്ട (Cancel)
                </button>
                <button 
                  onClick={confirmResetProgress}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-md shadow-rose-600/10"
                >
                  അതെ, റീസെറ്റ് ചെയ്യുക (Yes, Reset)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
