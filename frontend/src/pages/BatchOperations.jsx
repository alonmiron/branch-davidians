import { useState } from 'react';
import { generateBatch, uploadResults } from '../services/api';

export default function BatchOperations() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const handleGenerateBatch = async () => {
    setLoading(true);
    try {
      const response = await generateBatch({ year, month });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `batch_${year}_${month.toString().padStart(2, '0')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('Batch file generated successfully!');
    } catch (error) {
      console.error('Error generating batch:', error);
      alert('Failed to generate batch file');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
    setUploadResult(null);
  };

  const handleUploadResults = async () => {
    if (!uploadFile) {
      alert('Please select a file first');
      return;
    }

    setLoading(true);
    try {
      const response = await uploadResults(uploadFile);
      setUploadResult(response.data);
      setUploadFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error uploading results:', error);
      alert('Failed to upload result file');
    } finally {
      setLoading(false);
    }
  };

  const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Batch Operations</h1>
          <p className="mt-2 text-sm text-gray-700">
            Generate batch charge files and upload result files
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {/* Generate Batch Section */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Generate Batch Charge File
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Select the month and year to generate a CSV file for batch credit card charging.</p>
            </div>
            <div className="mt-5 sm:flex sm:items-center space-x-4">
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                  Month
                </label>
                <select
                  id="month"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700">
                  Year
                </label>
                <select
                  id="year"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGenerateBatch}
                  disabled={loading}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
                >
                  {loading ? 'Generating...' : 'Generate & Download'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Results Section */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Upload Result File
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Upload the result CSV file received from the credit card processor.</p>
            </div>
            <div className="mt-5">
              <div className="flex items-center space-x-4">
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <button
                  type="button"
                  onClick={handleUploadResults}
                  disabled={loading || !uploadFile}
                  className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:bg-gray-400"
                >
                  {loading ? 'Uploading...' : 'Upload & Process'}
                </button>
              </div>
            </div>

            {uploadResult && (
              <div className="mt-6 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Upload Successful</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <ul className="list-disc space-y-1 pl-5">
                        <li>Total processed: {uploadResult.total_processed}</li>
                        <li>Successful charges: {uploadResult.successful}</li>
                        <li>Failed charges: {uploadResult.failed}</li>
                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                          <li>
                            <details>
                              <summary className="cursor-pointer">Errors ({uploadResult.errors.length})</summary>
                              <ul className="mt-2 space-y-1">
                                {uploadResult.errors.map((error, idx) => (
                                  <li key={idx} className="text-red-600">{error}</li>
                                ))}
                              </ul>
                            </details>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



