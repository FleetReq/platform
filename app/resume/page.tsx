import type { Metadata } from "next";
import BackgroundAnimation from '../components/BackgroundAnimation'

export const metadata: Metadata = {
  title: "Resume - Bruce Truong",
  description: "Professional resume of Bruce Truong, Site Reliability Engineer",
  openGraph: {
    title: 'Resume - Bruce Truong',
    description: 'Professional resume of Bruce Truong, Site Reliability Engineer',
    url: 'https://brucetruong.com/resume',
  },
  twitter: {
    title: 'Resume - Bruce Truong',
    description: 'Professional resume of Bruce Truong, Site Reliability Engineer',
  },
};

export default function Resume() {
  return (
    <div className="relative overflow-hidden min-h-screen">
      <BackgroundAnimation />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Resume
          </h1>
          <div className="text-xl text-gray-600 dark:text-gray-300 space-y-2 max-w-2xl mx-auto">
            <p className="font-semibold text-gray-900 dark:text-white">Bruce Truong</p>
            <p className="whitespace-nowrap">Site Reliability Engineer | DevOps Engineer | Infrastructure Automation Specialist</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-lg">
              <span>Beaverton, OR</span>
              <span className="hidden sm:block">•</span>
              <a href="mailto:careers@brucetruong.com" className="text-blue-600 dark:text-blue-400 hover:underline">careers@brucetruong.com</a>
              <span className="hidden sm:block">•</span>
              <a href="tel:+19714448816" className="text-blue-600 dark:text-blue-400 hover:underline">971.444.8816</a>
            </div>
          </div>
        </header>

        {/* Professional Summary Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b-2 border-blue-500 dark:border-blue-400 pb-2">
            PROFESSIONAL SUMMARY
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              Experienced Site Reliability Engineer with proven expertise in large-scale infrastructure automation, cloud migration, and system monitoring. Successfully architected and executed critical MongoDB migration of 60+ billion documents to production, demonstrating strong technical leadership and problem-solving abilities. Proficient in DevOps practices, container orchestration, infrastructure as code, and observability platforms. Combines solid computer science foundation with hands-on experience in high-availability systems, CI/CD pipelines, and cross-functional team collaboration.
            </p>
            <div className="mt-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Core Competencies:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Site Reliability Engineering",
                  "Cloud Migration", 
                  "Infrastructure Automation",
                  "DevOps",
                  "Kubernetes",
                  "Database Management",
                  "System Monitoring",
                  "CI/CD Pipelines"
                ].map((competency) => (
                  <span
                    key={competency}
                    className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm"
                  >
                    {competency}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Education Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b-2 border-blue-500 dark:border-blue-400 pb-2">
            EDUCATION
          </h2>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold dark:text-white">
                  Portland State University
                </h3>
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  Jan 2015 – Jun 2024
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic mb-3">
                Bachelor of Science - Major in Computer Science, Minor in
                Philosophy
              </p>
              <div className="ml-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                  PSU Capstone - Bike Index Platform Team Lead
                </h4>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                  <li>
                    Organized and led a 5-member team to create, edit, and search through theft information on the Bike Index Platform
                  </li>
                  <li>
                    Collaborated via Scrum methodology to navigate through
                    bi-weekly project sprints
                  </li>
                  <li>
                    <a href="https://github.com/impeccKable/bike-index-platform" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      View project on GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold dark:text-white">
                  Portland Community College
                </h3>
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  Jan 2008 – Mar 2023
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 italic">
                Associate of Science – Oregon Transfer
              </p>
            </div>
          </div>
        </section>

        {/* Technical Skills Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b-2 border-blue-500 dark:border-blue-400 pb-2">
            TECHNICAL SKILLS
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Programming & Scripting:
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Go", "Python", "Bash/Shell", "SQL", "TypeScript", "C++", "C", "Rust"].map(
                  (skill) => (
                    <span
                      key={skill}
                      className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Cloud & Infrastructure:
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Google Cloud Platform",
                  "Kubernetes",
                  "Docker",
                  "Terraform",
                  "Infrastructure as Code",
                  "Helm",
                  "GitOps",
                  "CI/CD Pipelines",
                  "GitHub Actions"
                ].map((tech) => (
                  <span
                    key={tech}
                    className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Databases & Monitoring:
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "MongoDB",
                  "PostgreSQL",
                  "DataDog",
                  "Observability",
                  "Kafka",
                  "RabbitMQ",
                  "Message Queues",
                  "Performance Monitoring",
                  "SLA Management"
                ].map((tech) => (
                  <span
                    key={tech}
                    className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
              DevOps & SRE Practices:
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Site Reliability Engineering",
                "DevOps",
                "Microservices Architecture",
                "High Availability Systems",
                "Disaster Recovery",
                "Incident Response",
                "Automation",
                "Load Balancing",
                "Scalability",
                "System Performance Optimization"
              ].map((practice) => (
                <span
                  key={practice}
                  className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm"
                >
                  {practice}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications & Professional Development Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b-2 border-blue-500 dark:border-blue-400 pb-2">
            CERTIFICATIONS & PROFESSIONAL DEVELOPMENT
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Currently Pursuing:</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>Google Cloud Professional DevOps Engineer</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>Certified Kubernetes Administrator (CKA)</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span>AWS Solutions Architect Associate</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Professional Development:</h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Site Reliability Engineering Fundamentals</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Infrastructure as Code with Terraform</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Kubernetes Production Best Practices</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b-2 border-blue-500 dark:border-blue-400 pb-2">
            EXPERIENCE
          </h2>

          <div className="space-y-8">
            {/* Apex Fintech Solutions */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-semibold dark:text-white">
                    Apex Fintech Solutions
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    Site Reliability Engineer
                  </p>
                </div>
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  Jan 2024 - Present
                </span>
              </div>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-3">
                <li>
                  <strong>Architected and executed</strong> critical production MongoDB migration using custom bash automation scripts, successfully migrating 60+ billion documents from on-premise infrastructure to Atlas cloud services with zero data loss and minimal downtime, reducing operational costs by 30% while improving system reliability
                </li>
                <li>
                  <strong>Implemented comprehensive monitoring solutions</strong> using DataDog observability platform, establishing 15+ custom dashboards and alerts that reduced mean time to detection (MTTD) by 40% and improved system visibility across microservices architecture
                </li>
                <li>
                  <strong>Optimized codebase quality</strong> through systematic refactoring initiatives, increasing code coverage from 65% to 85% using automated testing frameworks and implementing CI/CD best practices that reduced deployment time by 50%
                </li>
                <li>
                  <strong>Collaborated with cross-functional teams</strong> of 8+ engineers to maintain 99.9% uptime SLA for mission-critical financial services infrastructure handling 1M+ daily transactions
                </li>
              </ul>
            </div>

            {/* Trimble */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-semibold dark:text-white">
                    Trimble
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    Software Engineer Intern
                  </p>
                </div>
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  Jul 2023 - Dec 2023
                </span>
              </div>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-3">
                <li>
                  <strong>Delivered high-quality software solutions</strong> in dual Developer/QA role, executing comprehensive testing strategies that reduced production bugs by 35% and accelerated release cycles by 25% through automated testing frameworks
                </li>
                <li>
                  <strong>Engineered database solutions</strong> using SQL Server Management Studio (SSMS) and T-SQL, optimizing query performance by 40% and developing 10+ custom forms using C# and VB.NET for enterprise applications
                </li>
                <li>
                  <strong>Streamlined development workflows</strong> using Azure DevOps, implementing CI/CD pipelines and Git version control that improved team productivity by 30% and reduced deployment errors by 60%
                </li>
              </ul>
            </div>

            {/* Holy Trinity Catholic School */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-semibold dark:text-white">
                    Holy Trinity Catholic School
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    Math/Coding/Photography Instructor
                  </p>
                </div>
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  Sep 2018 - Jan 2022
                </span>
              </div>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-3">
                <li>
                  Improved and trained staff with recent mathematic learning
                  strategies
                </li>
                <li>
                  Supported staff with technology hardware, software,
                  telecommunications, and peripheral systems
                </li>
                <li>Established the coding and photography curriculum</li>
                <li>
                  Evaluated software and hardware requirements and recommended
                  purchases for the institution
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Download Resume Button */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            PDF resume available upon request - please contact me
          </p>
        </div>
      </div>
    </div>
  );
}