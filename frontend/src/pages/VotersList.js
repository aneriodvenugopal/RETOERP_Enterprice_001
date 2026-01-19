import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Users, User, ChevronLeft, ChevronRight, Lock, Eye, EyeOff, Download, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const VotersList = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Data state
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Filter state
  const [selectedWard, setSelectedWard] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVoters, setTotalVoters] = useState(0);
  const limit = 50;

  // Check if already authenticated
  useEffect(() => {
    const token = sessionStorage.getItem('voters_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/voters/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem('voters_token', data.token);
        setIsAuthenticated(true);
        toast.success('Login successful!');
      } else {
        toast.error(data.detail || 'Invalid password');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Fetch voters list
  const fetchVoters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedWard !== 'all') params.append('ward', selectedWard);
      if (selectedGender !== 'all') params.append('gender', selectedGender);
      if (ageMin) params.append('age_min', ageMin);
      if (ageMax) params.append('age_max', ageMax);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', currentPage);
      params.append('limit', limit);

      const response = await fetch(`${API_URL}/api/voters/list?${params}`);
      const data = await response.json();

      if (data.success) {
        setVoters(data.data);
        setTotalPages(data.pagination.total_pages);
        setTotalVoters(data.pagination.total);
      }
    } catch (error) {
      toast.error('Failed to fetch voters');
    } finally {
      setLoading(false);
    }
  }, [selectedWard, selectedGender, ageMin, ageMax, searchQuery, currentPage]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedWard !== 'all') params.append('ward', selectedWard);

      const response = await fetch(`${API_URL}/api/voters/stats?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  }, [selectedWard]);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchVoters();
      fetchStats();
    }
  }, [isAuthenticated, fetchVoters, fetchStats]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedWard, selectedGender, ageMin, ageMax, searchQuery]);

  // Clear filters
  const clearFilters = () => {
    setSelectedWard('all');
    setSelectedGender('all');
    setAgeMin('');
    setAgeMax('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Voters List</CardTitle>
            <p className="text-gray-300 text-sm mt-2">Aliyabad Municipality</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password (DDMMYY)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                disabled={loginLoading}
                data-testid="login-button"
              >
                {loginLoading ? 'Logging in...' : 'Access Voters List'}
              </Button>
            </form>
            <p className="text-center text-gray-400 text-xs mt-4">
              Password format: DDMMYY (Today's date)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Voters List Screen
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-7 h-7" />
                Voters List - Aliyabad
              </h1>
              <p className="text-blue-100 text-sm mt-1">Ward-wise Electoral Roll</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => {
                sessionStorage.removeItem('voters_token');
                setIsAuthenticated(false);
              }}
              data-testid="logout-button"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <p className="text-blue-100 text-sm">Total Voters</p>
                <p className="text-3xl font-bold">{stats.total.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <p className="text-green-100 text-sm">Male</p>
                <p className="text-3xl font-bold">{stats.male.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
              <CardContent className="p-4">
                <p className="text-pink-100 text-sm">Female</p>
                <p className="text-3xl font-bold">{stats.female.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <p className="text-purple-100 text-sm">Wards Available</p>
                <p className="text-3xl font-bold">{stats.wards?.length || 0}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search name, EPIC, house no..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="search-input"
                  />
                </div>
              </div>

              {/* Ward Filter */}
              <Select value={selectedWard} onValueChange={setSelectedWard}>
                <SelectTrigger className="w-[140px]" data-testid="ward-filter">
                  <SelectValue placeholder="Ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {stats?.wards?.map(ward => (
                    <SelectItem key={ward} value={String(ward)}>Ward {ward}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Gender Filter */}
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger className="w-[120px]" data-testid="gender-filter">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>

              {/* Age Range */}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min Age"
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  className="w-[90px]"
                  data-testid="age-min-input"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  placeholder="Max Age"
                  value={ageMax}
                  onChange={(e) => setAgeMax(e.target.value)}
                  className="w-[90px]"
                  data-testid="age-max-input"
                />
              </div>

              {/* Clear & Refresh */}
              <Button variant="outline" size="icon" onClick={clearFilters} title="Clear Filters">
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={fetchVoters} title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{voters.length}</span> of{' '}
            <span className="font-semibold">{totalVoters.toLocaleString()}</span> voters
          </p>
        </div>

        {/* Voters Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="voters-table">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SL No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">EPIC No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Father/Husband</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Age</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Gender</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">House No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading voters...
                    </td>
                  </tr>
                ) : voters.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      No voters found
                    </td>
                  </tr>
                ) : (
                  voters.map((voter, index) => (
                    <tr key={voter.epic_no || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{voter.sl_no || '-'}</td>
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">{voter.epic_no}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{voter.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{voter.father_husband_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{voter.age}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          voter.gender === 'M' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {voter.gender === 'M' ? 'Male' : 'Female'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{voter.house_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{voter.ward_no}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  data-testid="prev-page-btn"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="next-page-btn"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default VotersList;
