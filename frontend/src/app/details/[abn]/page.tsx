'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Utility function to format YYYYMMDD to DD MMM YYYY
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr || dateStr.length !== 8) return 'Not available';
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const date = new Date(`${year}-${month}-${day}`);
  return date.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Utility function to map status codes to readable values
const formatStatus = (status: string | null | undefined): string => {
  if (!status) return 'Not available';
  switch (status) {
    case 'ACT':
      return 'Active';
    case 'CAN':
      return 'Cancelled';
    default:
      return status;
  }
};

// Utility function to capitalize words in a string
const capitalizeWords = (str: string | null | undefined): string => {
  if (!str) return 'Not available';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface DetailResult {
  abn: string;
  status: string | null;
  statusDate: string | null;
  lastUpdated: string | null;
  entityTypeInd: string | null;
  entityTypeText: string | null;
  mainName: { name: string; type: string } | null;
  legalName: { title: string; givenName: string; familyName: string; type: string } | null;
  address: { state: string; postcode: string } | null;
  asicNumber: { number: string; type: string } | null;
  gst: { status: string; statusDate: string } | null;
  dgrs: { statusDate: string; name: string; type: string }[];
  otherNames: { name: string; type: string }[];
}

const DetailPage: React.FC = () => {
  const params = useParams();
  const abn = params?.abn as string;
  const [details, setDetails] = useState<DetailResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abn) {
      setError('ABN is required');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/details`, {
          params: { abn },
          timeout: 60000,
        });
        setDetails(response.data);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || 'An unexpected error occurred. Please try again.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [abn]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-6 shadow-md">
        <h1 className="text-3xl font-bold">Australian Business Registry Search</h1>
        <p className="mt-1 text-sm opacity-80">Search for businesses by ABN, ACN, or name</p>
      </header>

      <main className="container mx-auto p-6">
        {loading && (
          <div className="flex justify-center items-center space-x-3 my-10">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-blue-700 font-medium">Loading details...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-800 p-5 rounded-lg shadow-sm my-6">
            <p className="font-semibold">Error: {error}</p>
            <div className="mt-3">
              <Link href="/" className="text-blue-600 hover:underline">
                ← Back to Search
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && !details && (
          <div className="text-center text-gray-700 my-8">
            <p className="mb-4">No details found for this ABN.</p>
            <Link href="/" className="text-blue-600 hover:underline">
              ← Back to Search
            </Link>
          </div>
        )}

        {!loading && !error && details && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
              <h1 className="text-3xl font-extrabold text-gray-800">
                {details.mainName?.name || `${details.legalName?.givenName} ${details.legalName?.familyName}` || 'Business Details'}
              </h1>
              <Link href="/" className="text-blue-600 hover:underline text-sm mt-2 sm:mt-0">
                ← Back to Search
              </Link>
            </div>

            {/* Details Card */}
            <div className="bg-white shadow-lg rounded-2xl p-8 space-y-8">
              {/* Section: ABN Information */}
              <section>
                <h2 className="text-2xl font-semibold text-blue-700 border-b pb-2 mb-4">ABN Information</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-gray-600 font-medium">ABN</dt>
                    <dd className="text-gray-700">{details.abn}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 font-medium">Status</dt>
                    <dd className="text-gray-700">{formatStatus(details.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 font-medium">Status Date</dt>
                    <dd className="text-gray-700">{formatDate(details.statusDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 font-medium">Last Updated</dt>
                    <dd className="text-gray-700">{formatDate(details.lastUpdated)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 font-medium">Main Entity Name</dt>
                    <dd className="text-gray-700">{details.mainName?.name || 'Not available'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 font-medium">Main Entity Type</dt>
                    <dd className="text-gray-700">{details.mainName?.type || 'Not available'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 font-medium">Entity Type</dt>
                    <dd className="text-gray-700">{capitalizeWords(details.entityTypeText)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 font-medium">Entity Type Code</dt>
                    <dd className="text-gray-700">{details.entityTypeInd || 'Not available'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 font-medium">State</dt>
                    <dd className="text-gray-700">{details.address?.state || 'Not available'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 font-medium">Postcode</dt>
                    <dd className="text-gray-700">{details.address?.postcode || 'Not available'}</dd>
                  </div>
                </dl>
              </section>

              {/* Section: Legal Entity Name */}
              {details.legalName && (
                <section>
                  <h2 className="text-2xl font-semibold text-blue-700 border-b pb-2 mb-4">Legal Entity Name</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-gray-600 font-medium">Title</dt>
                      <dd className="text-gray-700">{details.legalName.title || 'Not available'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 font-medium">Given Name</dt>
                      <dd className="text-gray-700">{details.legalName.givenName || 'Not available'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 font-medium">Family Name</dt>
                      <dd className="text-gray-700">{details.legalName.familyName || 'Not available'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 font-medium">Type</dt>
                      <dd className="text-gray-700">{details.legalName.type || 'Not available'}</dd>
                    </div>
                  </dl>
                </section>
              )}

              {/* Section: ASIC Number */}
              <section>
                <h2 className="text-2xl font-semibold text-blue-700 border-b pb-2 mb-4">ASIC Information</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-gray-600 font-medium">ASIC Number</dt>
                    <dd className="text-gray-700">{details.asicNumber?.number || 'Not available'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 font-medium">ASIC Type</dt>
                    <dd className="text-gray-700">{details.asicNumber?.type || 'Not available'}</dd>
                  </div>
                </dl>
              </section>

              {/* Section: GST Status */}
              <section>
                <h2 className="text-2xl font-semibold text-blue-700 border-b pb-2 mb-4">GST Status</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-gray-600 font-medium">Status</dt>
                    <dd className="text-gray-700">{formatStatus(details.gst?.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 font-medium">Status Date</dt>
                    <dd className="text-gray-700">{formatDate(details.gst?.statusDate)}</dd>
                  </div>
                </dl>
              </section>

              {/* Section: Deductible Gift Recipient Funds */}
              {details.dgrs.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold text-blue-700 border-b pb-2 mb-4">Deductible Gift Recipient Funds</h2>
                  <ul className="list-disc list-inside space-y-2">
                    {details.dgrs.map((dgr, idx) => (
                      <li key={idx} className="text-gray-700">
                        {dgr.name} (Type: {dgr.type}, Status Date: {formatDate(dgr.statusDate)})
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Section: Other Names (Business/Trading) */}
              {details.otherNames.length > 0 && (
                <section>
                  <h2 className="text-2xl font-semibold text-blue-700 border-b pb-2 mb-4">Other Names (Business/Trading)</h2>
                  <ul className="list-disc list-inside space-y-2">
                    {details.otherNames.map((otherName, idx) => (
                      <li key={idx} className="text-gray-700">
                        {otherName.name} (Type: {otherName.type})
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DetailPage;