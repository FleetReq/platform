import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume - Bruce Truong",
  description: "Professional resume of Bruce Truong, Site Reliability Engineer",
};

export default function Resume() {
  return (
    <div className="bg-white dark:bg-gray-900 py-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Bruce Truong
          </h1>
          <div className="text-lg text-gray-600 dark:text-gray-300 space-y-1">
            <p>Beaverton, OR</p>
            <p>careers@brucetruong.com | 971.444.8816</p>
          </div>
        </header>

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

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Programming Languages:
              </h3>
              <div className="flex flex-wrap gap-2">
                {["Go", "Python", "Bash", "SQL", "C++", "C", "Rust", "TypeScript"].map(
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
                Technologies:
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "GCP",
                  "Kubernetes", 
                  "Docker",
                  "Terraform",
                  "Helm",
                  "Kafka",
                  "RabbitMQ",
                  "IBM MQ",
                  "MongoDB",
                  "PostgreSQL",
                  "DataDog",
                  "GitHub Actions",
                  "Ubuntu",
                  "GitOps",
                  "Jira",
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
                  Engineered bash automation scripts for production MongoDB
                  migration, successfully migrating filtered digital assets
                  collection containing 60 billion documents from on-premise
                  infrastructure to Atlas cloud services, including
                  comprehensive testing, documentation, and team training
                </li>
                <li>
                  Acquired proficiency in utilizing the Datadog metrics platform
                  for comprehensive monitoring and analysis, enhancing
                  visibility and performance optimization within complex systems
                </li>
                <li>
                  Refactoring code for simplicity and readability, including
                  usage of code coverage tools as a guide to writing more
                  comprehensive tests
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
                  Successfully fulfilled dual roles as a Developer and Quality
                  Assurance professional, ensuring high-quality software
                  delivery through meticulous testing and development practices
                </li>
                <li>
                  Proficiently utilized SQL Server Management Studio (SSMS) for
                  database management, T-SQL for querying and manipulation, and
                  developed forms using C# and VB
                </li>
                <li>
                  Demonstrated expertise in code and task management using Azure
                  DevOps (AZDO), Azure, and Git, facilitating streamlined
                  development processes and collaboration
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
          <a
            href="/api/resume-pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center hover:shadow-lg transform hover:scale-105 duration-300"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download PDF Resume
          </a>
        </div>
      </div>
    </div>
  );
}