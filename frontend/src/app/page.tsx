'use client';
import { useState, FormEvent } from 'react';
import axios from 'axios';

interface SearchResult {
  abn: string;
  name: string | null;
  state: string | null;
  postcode: string | null;
}

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/search?query=${encodeURIComponent(query)}`, {
        timeout: 15000 // Timeout after 15 seconds
      });
      setResults(response.data.results);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">ABN Search</h1>
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search business name (e.g., forest coach)"
          className="border p-2 rounded w-full md:w-1/2"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white p-2 rounded ml-2"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
      {loading && <p className="text-blue-500">Loading... (may take a few seconds)</p>}
      {results.length > 0 ? (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ABN</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">State</th>
              <th className="border p-2">Postcode</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index}>
                <td className="border p-2">{result.abn}</td>
                <td className="border p-2">{result.name || '-'}</td>
                <td className="border p-2">{result.state || '-'}</td>
                <td className="border p-2">{result.postcode || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>No results</p>
      )}
    </div>
  );
}