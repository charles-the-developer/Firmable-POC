'use client';
import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import ResultsTable from './components/ResultsTable';
import Pagination from './components/Pagination';

interface SearchResult {
  abn: string;
  name: string | null;
  state: string | null;
  postcode: string | null;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const Home: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [entityType, setEntityType] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    setResults([]); // Clear results on new search
    try {
      const response = await axios.get(`/api/search`, {
        params: {
          query,
          state,
          entityType,
          page,
          pageSize: pagination.pageSize,
        },
        timeout: 60000,
      });
      setResults(response.data.results);
      setPagination({
        ...pagination,
        page,
        totalCount: response.data.pagination.totalCount,
        totalPages: response.data.pagination.totalPages,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchResults(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchResults(newPage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-2xl font-bold">Australian Business Registry Search</h1>
        <p className="text-sm">Search for businesses by ABN, ACN, or name</p>
      </header>
      <main className="container mx-auto p-6">
        <SearchBar
          query={query}
          setQuery={setQuery}
          state={state}
          setState={setState}
          entityType={entityType}
          setEntityType={setEntityType}
          onSearch={handleSearch}
          loading={loading}
        />
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg shadow-sm" role="alert">
            {error}
          </div>
        )}
        {loading && (
          <div className="flex justify-center my-4">
            <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-blue-600">Loading... (may take a few seconds)</span>
          </div>
        )}
        {!loading && !error && results.length === 0 && (
          <p className="text-gray-600 mt-4">
            No results found. Try adjusting your search or filters. 😔
          </p>
        )}
        {!loading && !error && results.length > 0 && (
          <>
            <ResultsTable results={results} />
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default Home;