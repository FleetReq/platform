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
              <span>Beaverton, OR</span>
              <span className="hidden sm:block">•</span>
              <a href="mailto:careers@brucetruong.com" className="text-blue-600 dark:text-blue-400 hover:underline">careers@brucetruong.com</a>
              <span className="hidden sm:block">•</span>
              <a href="tel:+19714448816" className="text-blue-600 dark:text-blue-400 hover:underline">971.444.8816</a>
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
              Experienced Site Reliability Engineer specializing in observability platforms, cross-team collaboration, and automated remediation systems for large-scale distributed environments. Successfully architected and executed critical MongoDB migration of 60+ billion documents to production, demonstrating expertise in system reliability and service performance optimization. Proven track record building monitoring solutions, implementing infrastructure as code, and partnering with development teams to ensure SLA compliance. Combines strong technical foundation with hands-on experience in container orchestration, API development, and incident response procedures.
            </p>
            <div className="mt-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Core Competencies:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Observability Platforms",
                  "Cross-Team Collaboration",
                  "Automated Remediation",
                  "SLA Management",
                  "Container Orchestration",
                  "RESTful APIs",
                  "Incident Response",
                  "Service Reliability"
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
          </div>
        </section>

        {/* Technical Skills Section */}
        <section className="mb-12 py-8 bg-gradient-to-r from-green-50/80 to-blue-50/80 dark:from-green-900/20 dark:to-blue-900/20 backdrop-blur-sm rounded-2xl">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b-2 border-blue-500 dark:border-blue-400 pb-2 text-center">
            TECHNICAL SKILLS
          </h2>
          <div className="px-4">

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
                  "Apache Cassandra",
                  "DataDog",
                  "Observability Platforms",
                  "RESTful APIs",
                  "Web Applications",
                  "Distributed Systems",
                  "Performance Monitoring"
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
                  <strong>Deployed and maintained observability platform</strong> using DataDog, establishing 15+ custom dashboards and automated alerts that reduced mean time to detection (MTTD) by 40% and enabled rapid error detection and remediation across distributed microservices architecture
                </li>
                <li>
                  <strong>Partnered across development, operations, and QA teams</strong> to architect and execute critical MongoDB migration of 60+ billion documents, ensuring service reliability and scalability while maintaining 99.9% SLA compliance through comprehensive testing and automated scripts
                </li>
                <li>
                  <strong>Developed automated remediation systems</strong> using Python and Bash scripting, creating monitoring and analysis tools that improved system performance by 30% and reduced manual intervention for common service-impacting issues
                </li>
                <li>
                  <strong>Provided guidance to 8+ engineers and developers</strong> on reliability best practices, implementing standardized troubleshooting procedures and incident response protocols that increased confidence in service performance expectations
                </li>
                <li>
                  <strong>Participated in on-call rotations</strong> for mission-critical financial services infrastructure handling 1M+ daily transactions, leading restoration and repair of service-impacting issues while maintaining zero data loss record
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
                  <strong>Mentored 50+ computer science students</strong> in algorithms, data structures, and programming fundamentals, improving student success rates by 25% through personalized debugging and code review sessions
                </li>
                <li>
                  <strong>Diagnosed and resolved complex technical issues</strong> including compiler errors, runtime bugs, and performance bottlenecks across multiple programming languages (C++, Python, Java)
                </li>
                <li>
                  <strong>Facilitated collaborative learning environments</strong> by leading group tutoring sessions and developing standardized troubleshooting methodologies for common programming challenges
                </li>
                <li>
                  <strong>Enhanced technical communication skills</strong> by translating complex algorithmic concepts into accessible explanations, demonstrating ability to bridge technical and non-technical stakeholders
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
                  <strong>Automated data analysis workflows</strong> using SQL and custom scripts, streamlining regulatory compliance processes and reducing manual reporting time by 60%
                </li>
                <li>
                  <strong>Managed enterprise database systems</strong> (CMMS) for supply chain operations, ensuring data integrity and optimizing query performance for 100+ daily users
                </li>
                <li>
                  <strong>Led cross-functional facility improvement projects</strong> with budgets exceeding $500K, coordinating between engineering, operations, and compliance teams to deliver on-time results
                </li>
                <li>
                  <strong>Developed training programs</strong> for 20+ employees on database software and operational procedures, improving team efficiency and reducing onboarding time by 40%
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
                  <strong>Architected and implemented</strong> comprehensive coding curriculum for 200+ students across K-8 grades, introducing Python programming and web development fundamentals that increased STEM engagement by 60%
                </li>
                <li>
                  <strong>Led technology infrastructure modernization</strong>, managing hardware procurement, software deployment, and system administration for 25+ faculty members while reducing IT support requests by 45%
                </li>
                <li>
                  <strong>Designed and delivered technical training programs</strong> for cross-functional teams, improving staff technology proficiency by 40% and establishing standardized workflows for educational technology integration
                </li>
                <li>
                  <strong>Evaluated and optimized</strong> institutional technology stack, conducting needs assessments and budget planning that resulted in 30% cost reduction while improving system reliability and performance
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact for Resume */}
        <div className="text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Ready to Discuss Opportunities
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Formatted PDF resume and references available for qualified positions
            </p>
            <a 
              href="mailto:careers@brucetruong.com?subject=Resume Request - SRE Position"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-300"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Contact for Full Resume
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}