import Link from 'next/link';

interface SearchResult {
  abn: string;
  name: string | null;
  state: string | null;
  postcode: string | null;
}

interface ResultsTableProps {
  results: SearchResult[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white shadow-md rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-3 px-4 text-left text-gray-600">ABN</th>
            <th className="py-3 px-4 text-left text-gray-600">Name</th>
            <th className="py-3 px-4 text-left text-gray-600">State</th>
            <th className="py-3 px-4 text-left text-gray-600">Postcode</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr
              key={result.abn}
              className="border-t hover:bg-gray-50 cursor-pointer"
            >
              <td className="py-3 px-4">
                <Link href={`/details/${result.abn}`} className="text-blue-600 hover:underline">
                  {result.abn}
                </Link>
              </td>
              <td className="py-3 px-4">
                <Link href={`/details/${result.abn}`} className="text-blue-600 hover:underline">
                  {result.name || 'N/A'}
                </Link>
              </td>
              <td className="py-3 px-4">{result.state || 'N/A'}</td>
              <td className="py-3 px-4">{result.postcode || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;