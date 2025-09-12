import Link from "next/link";
import Image from "next/image";
import BackgroundAnimation from './components/BackgroundAnimation';
import HeroSection from './components/HeroSection';

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Bruce Truong",
  "jobTitle": "Site Reliability Engineer",
  "description": "Site Reliability Engineer specializing in cloud migration, infrastructure automation, and high-availability systems",
  "url": "https://brucetruong.com",
  "image": "https://brucetruong.com/images/profile.jpg",
  "email": "careers@brucetruong.com",
  "telephone": "+1-971-444-8816",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Beaverton",
    "addressRegion": "OR",
    "addressCountry": "US"
  },
  "worksFor": {
    "@type": "Organization",
    "name": "Apex Fintech Solutions"
  },
  "alumniOf": {
    "@type": "Organization",
    "name": "Portland State University"
  },
  "knowsAbout": [
    "Site Reliability Engineering",
    "Cloud Migration",
    "Kubernetes",
    "MongoDB",
    "Google Cloud Platform",
    "Terraform",
    "Go Programming",
    "Python",
    "Infrastructure Automation",
    "High Availability Systems"
  ],
  "sameAs": [
    "https://www.linkedin.com/in/brucentruong/",
    "https://github.com/DeeAhTee",
    "https://www.instagram.com/deeahtee/"
  ]
};

export default function Home() {
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
    <div className="relative overflow-hidden min-h-screen">
      <BackgroundAnimation />
      <HeroSection />

      {/* Quick Overview Section */}
      <section id="services" className="relative py-20 px-4 sm:px-6 lg:px-8">
        {/* Section background with blur effect */}
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/40 backdrop-blur-md"></div>
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What I Do
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group text-center p-8 bg-white/95 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:bg-white dark:hover:bg-gray-900/90">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                Site Reliability Engineering
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Building and maintaining scalable systems, automating infrastructure, and ensuring high availability for enterprise applications
              </p>
            </div>
            
            <div className="group text-center p-8 bg-white/95 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:bg-white dark:hover:bg-gray-900/90">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-green-400">
                Software Development
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Full-stack development with expertise in Go, Python, TypeScript, and modern web technologies for scalable solutions
              </p>
            </div>
            
            <div className="group text-center p-8 bg-white/95 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:bg-white dark:hover:bg-gray-900/90">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                Cloud & DevOps
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Experience with GCP, Kubernetes, Docker, Terraform, and modern CI/CD practices for reliable deployments
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="relative py-20 px-4 sm:px-6 lg:px-8">
        {/* Section background with subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-transparent dark:via-gray-900/30 backdrop-blur-md"></div>
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Leading Companies
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mb-4"></div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Building reliable systems and leading technical initiatives at industry-leading organizations
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Apex Fintech */}
            <div className="group bg-white/98 dark:bg-gray-900/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-200/40 dark:border-gray-700/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:bg-white dark:hover:bg-gray-900 hover:border-green-300/60 dark:hover:border-green-700/50">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-xl flex items-center justify-center mr-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 overflow-hidden shadow-lg border border-green-200/50 dark:border-green-700/50">
                  <Image
                    src="/images/apex-logo.jpg"
                    alt="Apex Fintech Solutions"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-green-600 dark:group-hover:text-green-400">Apex Fintech</h3>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full inline-block">2024 - Present</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Leading MongoDB migration of <strong className="text-green-600 dark:text-green-400">60+ billion documents</strong> to cloud infrastructure with comprehensive automation and testing
              </p>
            </div>
            
            {/* Trimble */}
            <div className="group bg-white/98 dark:bg-gray-900/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-200/40 dark:border-gray-700/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:bg-white dark:hover:bg-gray-900 hover:border-blue-300/60 dark:hover:border-blue-700/50">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-xl flex items-center justify-center mr-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 overflow-hidden shadow-lg border border-blue-200/50 dark:border-blue-700/50">
                  <Image
                    src="/images/trimble-logo.png"
                    alt="Trimble Inc"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Trimble</h3>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full inline-block">2023</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Full-stack development and <strong className="text-blue-600 dark:text-blue-400">Quality Assurance</strong> using Azure DevOps, modern CI/CD, and database management
              </p>
            </div>
            
            {/* Portland State */}
            <div className="group bg-white/98 dark:bg-gray-900/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-200/40 dark:border-gray-700/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:bg-white dark:hover:bg-gray-900 hover:border-purple-300/60 dark:hover:border-purple-700/50">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-xl flex items-center justify-center mr-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 overflow-hidden shadow-lg border border-purple-200/50 dark:border-purple-700/50">
                  <Image
                    src="/images/psu-logo.png"
                    alt="Portland State University"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">Portland State</h3>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full inline-block">2015 - 2024</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                <strong className="text-purple-600 dark:text-purple-400">Computer Science degree</strong> with team leadership experience in Capstone project development
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section id="contact" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Build Something Amazing?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Let&#39;s discuss how I can help scale your infrastructure and solve complex technical challenges
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Get In Touch
              <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </Link>
            
            <Link
              href="/about"
              className="border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-gray-900 px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Learn More About Me
            </Link>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}