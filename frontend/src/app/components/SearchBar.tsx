import { FormEvent, Dispatch, SetStateAction } from 'react';

interface SearchBarProps {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  state: string;
  setState: Dispatch<SetStateAction<string>>;
  entityType: string;
  setEntityType: Dispatch<SetStateAction<string>>;
  onSearch: (e: FormEvent) => void;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, state, setState, entityType, setEntityType, onSearch, loading }) => {
  return (
    <form onSubmit={onSearch} className="flex flex-col gap-4 mb-6" role="search">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex flex-col">
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ABN, ACN, or Business Name..."
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 h-12"
            disabled={loading}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-6 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-48">
          <select
            id="entity-type-filter"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white h-12"
            disabled={loading}
          >
            <option value="">All Entity Types</option>
            <option value="Company">Company</option>
            <option value="Partnership">Partnership</option>
            <option value="Sole Trader">Sole Trader</option>
          </select>
        </div>
        <div className="w-full md:w-48">
          <select
            id="state-filter"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white h-12"
            disabled={loading}
          >
            <option value="">All States</option>
            <option value="NSW">NSW</option>
            <option value="VIC">VIC</option>
            <option value="QLD">QLD</option>
            <option value="SA">SA</option>
            <option value="WA">WA</option>
            <option value="TAS">TAS</option>
            <option value="NT">NT</option>
            <option value="ACT">ACT</option>
          </select>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;