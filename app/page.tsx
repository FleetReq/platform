"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6">
        {/* Dark Mode Toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>

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
                  PSU Capstone - Bike Threat Platform Team Lead
                </h4>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                  <li>
                    Organized and led a 5-member team to create software that
                    would facilitate information transfer pertaining to bike
                    threats around the world
                  </li>
                  <li>
                    Collaborated via Scrum methodology to navigate through
                    bi-weekly project sprints
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
                {["Go", "C++", "C", "Rust", "Python", "SQL", "TypeScript"].map(
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
                  "Terraform",
                  "Kafka",
                  "Kubernetes",
                  "IBM MQ",
                  "DataDog",
                  "GCP",
                  "GitOps",
                  "Docker",
                  "GitHub",
                  "Jira",
                  "MongoDB",
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
      </div>
    </main>
  );
}
