"use client";

interface PDFDownloadProps {
  className?: string;
}

export default function PDFDownload({
  className = ''
}: PDFDownloadProps) {

  const downloadPDF = () => {
    // Direct download of static PDF file
    const link = document.createElement('a');
    link.href = '/Bruce_Truong_Resume.pdf';
    link.download = 'Bruce_Truong_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={downloadPDF}
      className={`inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-semibold rounded-xl shadow-elegant-lg hover:shadow-elegant-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 ${className}`}
    >
      <svg className="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      Download PDF Resume
    </button>
  );
}