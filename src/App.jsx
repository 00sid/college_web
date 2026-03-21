import React, { useState, useEffect, useRef, useMemo } from "react";
import { gsap } from "gsap";
import {
  Search,
  User,
  Users,
  X,
  FileText,
  Award,
  TrendingUp,
  Loader2,
  Filter,
  ChevronDown,
  Building,
  GraduationCap,
} from "lucide-react";
import { getResearchData } from "./firebase/firestore/research_data";
import birLogo from "./assets/bir_logo.png";
const App = () => {
  // State for fetched projects
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    college: "All",
    department: "All",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // for filter debounce
  const [initialLoading, setInitialLoading] = useState(true); // for initial fetch
  const [error, setError] = useState(null);

  // Refs for GSAP animations
  const headerRef = useRef(null);
  const searchRef = useRef(null);
  const cardsContainerRef = useRef(null);
  const projectCardsRef = useRef([]);
  const filtersRef = useRef(null);

  // Predefined filter options
  const collegeOptions = [
    "Kanti Hospital",
    "Paropakar Hospital",
    "Bir Hospital",
    "Bhaktapur Hospital",
  ];
  const departmentOptions = ["BNS", "BSC", "BMS"];

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        const data = await getResearchData();
        setProjects(data);
        setFilteredProjects(data); // initially show all
      } catch (err) {
        console.error("Failed to fetch research data:", err);
        setError(err.message || "Failed to load data. Please try again.");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  // Initialize animations (only after data is loaded)
  useEffect(() => {
    if (initialLoading) return;

    // Header animation
    gsap.fromTo(
      headerRef.current,
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
    );

    // Search bar animation
    gsap.fromTo(
      searchRef.current,
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, delay: 0.2, ease: "back.out(1.7)" }
    );

    // Animate cards on initial load
    const cards = projectCardsRef.current;
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        { y: 50, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.4,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );
    }

    return () => {
      gsap.killTweensOf([headerRef.current, searchRef.current, cards]);
    };
  }, [initialLoading]);

  // Animate cards on filter change (when filteredProjects updates)
  useEffect(() => {
    if (isLoading || initialLoading) return;

    const cards = projectCardsRef.current.slice(0, filteredProjects.length);

    if (cards.length > 0) {
      gsap.killTweensOf(cards);
      gsap.to(cards, {
        opacity: 0,
        y: 20,
        scale: 0.95,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          projectCardsRef.current = projectCardsRef.current.slice(
            0,
            filteredProjects.length
          );
          gsap.fromTo(
            cards,
            { opacity: 0, y: 20, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.4,
              stagger: 0.05,
              ease: "power2.out",
            }
          );
        },
      });
    }
  }, [filteredProjects, isLoading, initialLoading]);

  // Handle search and filter with debouncing
  useEffect(() => {
    const applyFilters = () => {
      setIsLoading(true);

      let results = projects;

      // Apply search
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        results = results.filter(
          (project) =>
            project.researchTitle?.toLowerCase().includes(term) ||
            project.supervisorName?.toLowerCase().includes(term) ||
            project.studentsName?.some((student) =>
              student.toLowerCase().includes(term)
            ) ||
            project.department?.toLowerCase().includes(term) ||
            project.collegeName?.toLowerCase().includes(term) ||
            project.year.includes(term)
        );
      }

      // Apply college filter
      if (filters.college !== "All") {
        results = results.filter(
          (project) => project.collegeName === filters.college
        );
      }

      // Apply department filter
      if (filters.department !== "All") {
        results = results.filter(
          (project) => project.department === filters.department
        );
      }

      setFilteredProjects(results);

      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    };

    const timer = setTimeout(applyFilters, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, projects]);

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
  };

  // Handle filter change
  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ college: "All", department: "All" });
    setSearchTerm("");
  };

  // Toggle filters panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
    if (filtersRef.current && !showFilters) {
      // Only animate when opening
      gsap.fromTo(
        filtersRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.4, ease: "power2.inOut" }
      );
    }
  };

  // Active filter count
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== "All"
  ).length;

  // Statistics
  const totalProjects = projects.length;
  const uniqueYears = useMemo(
    () => new Set(projects.map((p) => p.year)).size,
    [projects]
  );
  const totalStudents = useMemo(
    () =>
      Array.from(new Set(projects.flatMap((p) => p.studentsName || []))).length,
    [projects]
  );
  const totalCitations = useMemo(
    () => projects.reduce((sum, project) => sum + (project.citations || 0), 0),
    [projects]
  );

  // Loading state UI
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading research projects...</p>
        </div>
      </div>
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      {/* <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div ref={headerRef} className="max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Nursing Research Repository
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-6">
              Discover and explore research projects from senior nursing
              students
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <FileText size={20} />
                <span>{totalProjects} Projects</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Award size={20} />
                <span>{totalCitations} Citations</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <TrendingUp size={20} />
                <span>{uniqueYears} Academic Years</span>
              </div>
            </div>
          </div>
        </div>
      </div> */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div ref={headerRef} className="max-w-4xl">
            {/* Institution Name */}
            <div className="mb-3">
              <span className="text-blue-100 text-sm md:text-base font-medium tracking-wide uppercase">
                National Academy of Medical Science
              </span>
            </div>

            {/* Logo and Title Row */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-4">
              <img
                src={birLogo}
                alt="BIR Logo"
                className="h-12 md:h-16 w-auto object-contain"
              />
              <div>
                <h1 className="text-3xl md:text-5xl font-bold">
                  Nursing Research Repository
                </h1>
                <p className="text-lg md:text-xl text-blue-100 mt-2">
                  Discover and explore research projects from senior nursing
                  students
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <FileText size={20} />
                <span>{totalProjects} Projects</span>
              </div>
              {/* <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Award size={20} />
                <span>{totalCitations} Citations</span>
              </div> */}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <TrendingUp size={20} />
                <span>{uniqueYears} Academic Years</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Search and Filter Section */}
        <div ref={searchRef} className="mb-8">
          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={22}
              />
              <input
                type="text"
                placeholder="Search projects by title, supervisor, or student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-10 py-3 text-lg border-0 focus:ring-2 focus:ring-blue-500 rounded-lg bg-gray-50 focus:bg-white"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Button */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={toggleFilters}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <Filter size={18} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px]">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
              >
                <X size={14} />
                Clear all filters
              </button>
            )}
          </div>

          {/* Filter Options Panel */}
          {showFilters && (
            <div
              ref={filtersRef}
              className="mt-4 bg-white rounded-xl shadow-lg p-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* College Filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Building size={18} />
                    College / Hospital
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFilterChange("college", "All")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.college === "All"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      All
                    </button>
                    {collegeOptions.map((college) => (
                      <button
                        key={college}
                        onClick={() => handleFilterChange("college", college)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          filters.college === college
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {college}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Department Filter */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <GraduationCap size={18} />
                    Department
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleFilterChange("department", "All")}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.department === "All"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      All
                    </button>
                    {departmentOptions.map((dept) => (
                      <button
                        key={dept}
                        onClick={() => handleFilterChange("department", dept)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          filters.department === dept
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filters.college !== "All" && (
                <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm">
                  <Building size={14} />
                  {filters.college}
                  <button onClick={() => handleFilterChange("college", "All")}>
                    <X size={14} />
                  </button>
                </span>
              )}
              {filters.department !== "All" && (
                <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">
                  <GraduationCap size={14} />
                  {filters.department}
                  <button
                    onClick={() => handleFilterChange("department", "All")}
                  >
                    <X size={14} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results and Loading State */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Research Projects
              <span className="text-lg font-normal text-gray-600 ml-2">
                ({filteredProjects.length} found)
              </span>
            </h2>
            {isLoading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </div>
            )}
          </div>
        </div>

        {/* Projects Grid */}
        <div ref={cardsContainerRef}>
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  ref={(el) => (projectCardsRef.current[index] = el)}
                  className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => {}}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {project.year}
                        </span>
                        {/* <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <FileText size={14} />
                          {project.citations} cites
                        </span> */}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          project.isApproved === true
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {project.isApproved ? "Completed" : "Pending"}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {project.researchTitle}
                    </h3>

                    <div className="flex items-start gap-3 mb-4">
                      <User
                        className="text-gray-400 mt-1 flex-shrink-0"
                        size={18}
                      />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                          Supervisor
                        </p>
                        <p className="font-medium text-gray-900">
                          {project.supervisorName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 mb-6">
                      <Users
                        className="text-gray-400 mt-1 flex-shrink-0"
                        size={18}
                      />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                          Student Researchers
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {project.studentsName?.map((student, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                            >
                              {student}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                          {project.collegeName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {project.department}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl shadow-lg">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  No matching projects found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search term or filters to find relevant
                  projects.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {totalProjects}
              </div>
              <div className="text-gray-600">Total Projects</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {uniqueYears}
              </div>
              <div className="text-gray-600">Academic Years</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {totalStudents}
              </div>
              <div className="text-gray-600">Student Researchers</div>
            </div>
            {/* <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {totalCitations}
              </div>
              <div className="text-gray-600">Total Citations</div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Footer */}
      {/* <footer className="mt-12 py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Nursing College Research Repository © {new Date().getFullYear()}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            For academic and research purposes only
          </p>
        </div>
      </footer> */}
      {/* Footer */}
      <footer className="mt-12 py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            Nursing College Research Repository © {new Date().getFullYear()}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            For academic and research purposes only
          </p>
          <p className="text-gray-600 text-xs mt-4">
            Developed by{" "}
            <a
              href="mailto:developer.00sid@gmail.com"
              className="text-gray-400 hover:text-gray-300 underline"
            >
              Siddhartha Basnet
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
