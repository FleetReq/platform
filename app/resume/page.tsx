import type { Metadata } from "next";
import BackgroundAnimation from '../components/BackgroundAnimation'
import PDFDownload from '../components/PDFDownload'

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

      {/* PDF Download Button - Fixed Position */}
      <div className="fixed top-24 right-6 z-50 print:hidden">
        <PDFDownload />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="resume-content">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Resume
          </h1>
          <div className="text-xl text-gray-600 dark:text-gray-300 space-y-2 max-w-2xl mx-auto">
            <p className="font-semibold text-gray-900 dark:text-white">Bruce Truong</p>
            <p className="whitespace-nowrap">Site Reliability Engineer | DevOps Engineer | Infrastructure Automation Specialist</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-lg">
              <a href="mailto:careers@brucetruong.com" className="text-blue-600 dark:text-blue-400 hover:underline">careers@brucetruong.com</a>
              <span className="hidden sm:block">•</span>
              <a href="https://brucetruong.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">brucetruong.com</a>
            </div>
          </div>
        </header>

        {/* Professional Summary Section */}
        <section className="mb-12 py-8 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b-2 border-blue-500 dark:border-blue-400 pb-2 text-center">
            PROFESSIONAL SUMMARY
          </h2>
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 mx-4">
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              Site Reliability Engineer with 2+ years of experience specializing in observability platforms, cross-team collaboration, and automated systems for distributed environments. Expert in deploying and maintaining monitoring solutions using DataDog, developing Python and Bash automation scripts, and ensuring 99.9% SLA compliance. Proven track record architecting MongoDB migrations (60B+ documents), implementing containerized solutions with Kubernetes, and building RESTful APIs for financial services platforms.
            </p>
            <div className="mt-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Core Competencies:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Site Reliability Engineering",
                  "Observability Platforms",
                  "SLA Management & Compliance",
                  "Incident Response",
                  "Cross-Team Collaboration",
                  "Container Orchestration",
                  "RESTful APIs",
                  "FinTech"
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

        {/* Technical Skills Section */}
        <section className="mb-12 py-8 bg-gradient-to-r from-green-50/80 to-blue-50/80 dark:from-green-900/20 dark:to-blue-900/20 backdrop-blur-sm rounded-2xl">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b-2 border-blue-500 dark:border-blue-400 pb-2 text-center">
            TECHNICAL SKILLS
          </h2>
          <div className="px-4">

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Languages & Scripting:
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Python", "Bash/Shell", "Go", "SQL", "TypeScript"].map(
                  (skill) => (
                    <span
                      key={skill}
                      className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Observability & Monitoring:
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "DataDog",
                  "Performance Monitoring",
                  "SLA Management",
                  "Incident Response",
                  "Automated Remediation"
                ].map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Infrastructure & DevOps:
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "GCP",
                  "Terraform",
                  "Infrastructure as Code",
                  "Helm",
                  "GitOps",
                  "CI/CD Pipelines",
                  "GitHub Actions",
                  "Docker",
                  "Kubernetes"
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

            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Databases & APIs:
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "MongoDB (Atlas Migration)",
                  "PostgreSQL",
                  "Kafka",
                  "RabbitMQ",
                  "IBM MQ",
                  "RESTful APIs",
                  "Web Applications"
                ].map((tech) => (
                  <span
                    key={tech}
                    className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="mb-12 py-8 bg-gradient-to-r from-gray-50/80 to-blue-50/80 dark:from-gray-900/20 dark:to-blue-900/20 backdrop-blur-sm rounded-2xl">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b-2 border-blue-500 dark:border-blue-400 pb-2 text-center">
            EXPERIENCE
          </h2>
          <div className="px-4">

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
                  <strong>Developed Python and Bash automation scripts</strong> for MongoDB migration from on-premises to Atlas cloud, successfully transferring 60B+ documents with zero data loss
                </li>
                <li>
                  <strong>Deployed and maintained DataDog observability platform</strong> with 15+ custom dashboards and automated alerts
                </li>
                <li>
                  <strong>Developed automated remediation solutions</strong> improving MTTD by 40% and reducing manual intervention by 30%
                </li>
                <li>
                  <strong>Partnered across development, operations, and QA teams</strong> to ensure service reliability, maintaining 99.9% SLA compliance through monitoring and proactive incident response
                </li>
                <li>
                  <strong>Collaborated with Charles Schwab and DTCC</strong> to architect RESTful API integrations for Ascend SaaS platform, ensuring reliable connectivity for FinTech operations
                </li>
                <li>
                  <strong>Participated in on-call rotations</strong> for infrastructure handling 1M+ daily transactions, leading restoration of service-impacting issues while maintaining system reliability
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
                  <strong>Delivered software solutions</strong> in dual Developer/QA role, implementing automated testing frameworks that improved code quality and reduced production incidents by 30%
                </li>
                <li>
                  <strong>Engineered database solutions</strong> using SQL Server and T-SQL, optimizing query performance for enterprise applications while developing custom forms using C# and VB.NET
                </li>
                <li>
                  <strong>Streamlined development workflows</strong> using Azure DevOps CI/CD pipelines, improving team productivity and reducing deployment errors by 25%
                </li>
              </ul>
            </div>

            {/* Portland State University - CS Tutoring */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-semibold dark:text-white">
                    Portland State University
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    Computer Science Co-Tutoring Coordinator
                  </p>
                </div>
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  Jun 2022 - Dec 2023
                </span>
              </div>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-3">
                <li>
                  <strong>Mentored 50+ students</strong> in algorithms, data structures, and programming fundamentals through debugging and code review sessions across Python, Java, and C++
                </li>
                <li>
                  <strong>Diagnosed and resolved technical issues</strong> including compiler errors, runtime bugs, and performance bottlenecks
                </li>
                <li>
                  <strong>Enhanced cross-functional collaboration</strong> by translating complex algorithmic concepts into accessible explanations
                </li>
              </ul>
            </div>

            {/* Precision Castparts Corporation */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-semibold dark:text-white">
                    Precision Castparts Corporation
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    Supply Coordinating Manager
                  </p>
                </div>
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  Nov 2021 - Jun 2022
                </span>
              </div>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-3">
                <li>
                  <strong>Automated data analysis workflows</strong> using SQL and custom scripts, streamlining regulatory compliance and reducing manual reporting time by 60%
                </li>
                <li>
                  <strong>Led cross-functional facility improvement projects</strong> with $500k+ budgets, coordinating between engineering, operations, and compliance teams
                </li>
                <li>
                  <strong>Developed training programs</strong> for database software and operational procedures, improving team efficiency
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
                    Technology Coordinator & Curriculum Developer
                  </p>
                </div>
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  Sep 2018 - Jan 2022
                </span>
              </div>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 mt-3">
                <li>
                  <strong>Architected Python coding curriculum</strong> for 200+ students across K-8 grades
                </li>
                <li>
                  <strong>Led technology infrastructure modernization</strong>, managing hardware procurement and system administration while reducing support tickets by 45%
                </li>
                <li>
                  <strong>Optimized institutional technology stack</strong>, improving system reliability while reducing operational costs by 30%
                </li>
              </ul>
            </div>
          </div>
          </div>
        </section>

        {/* Education Section */}
        <section className="mb-12 py-8 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b-2 border-blue-500 dark:border-blue-400 pb-2 text-center">
            EDUCATION
          </h2>
          <div className="px-4">

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
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                Relevant Coursework: C++, C, Rust Programming, Distributed Systems, Web Applications
              </p>
              <div className="ml-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                  PSU Capstone - Bike Index Platform Team Lead
                </h4>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                  <li>
                    Led cross-functional team of 5+ developers implementing microservices architecture with RESTful APIs and containerized deployment for bike theft tracking platform
                  </li>
                  <li>
                    Collaborated across development and operations teams using Scrum methodology, delivering bi-weekly sprints while ensuring system reliability and performance
                  </li>
                  <li>
                    <a href="https://github.com/impeccKable/bike-index-platform" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      GitHub: https://github.com/impeccKable/bike-index-platform
                    </a>
                  </li>
                  <li>
                    Featured in <a href="https://bikeindex.org/news/bike-indexs-new-tool-in-the-fight-against-bike-crimes" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Bike Index article</a>: &quot;New Tool in the Fight Against Bike Crimes&quot;
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
          </div>
        </section>

        {/* Contact for Resume */}
        <section className="py-8 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl">
          <div className="text-center px-4">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Let&apos;s Connect
              </h3>
              <a
                href="mailto:careers@brucetruong.com?subject=Resume Request - SRE Position"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Contact for Full Resume
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}