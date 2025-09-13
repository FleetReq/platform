import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bruce Truong - Resume PDF',
  description: 'Bruce Truong - Site Reliability Engineer Resume',
}

export default function ResumePDFPage() {
  return (
    <div id="resume-pdf" className="bg-white text-black min-h-screen p-8 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <header className="text-center mb-8 pb-6 border-b-2 border-gray-300">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Bruce Truong</h1>
        <h2 className="text-xl font-medium text-gray-700 mb-4">Site Reliability Engineer | DevOps Engineer | Infrastructure Automation Specialist</h2>
        <div className="flex justify-center items-center text-sm text-gray-600 gap-4">
          <span>Beaverton, OR</span>
          <span>•</span>
          <span>careers@brucetruong.com</span>
          <span>•</span>
          <span>971.444.8816</span>
          <span>•</span>
          <span>brucetruong.com</span>
        </div>
      </header>

      {/* Professional Summary */}
      <section className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">PROFESSIONAL SUMMARY</h3>
        <p className="text-sm leading-relaxed text-gray-800 mb-4">
          Experienced Site Reliability Engineer specializing in observability platforms, cross-team collaboration, and automated remediation
          systems for large-scale distributed environments. Successfully architected and executed critical MongoDB migration of 60+ billion
          documents to production, demonstrating expertise in system reliability and service performance optimization. Proven track
          record building monitoring solutions, implementing infrastructure as code, and partnering with development teams to ensure
          SLA compliance. Combines strong technical foundation with hands-on experience in container orchestration, API development,
          and incident response procedures.
        </p>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Core Competencies:</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-blue-50 px-2 py-1 rounded">Observability Platforms</div>
            <div className="bg-blue-50 px-2 py-1 rounded">Cross-Team Collaboration</div>
            <div className="bg-blue-50 px-2 py-1 rounded">Automated Remediation</div>
            <div className="bg-blue-50 px-2 py-1 rounded">SLA Management</div>
            <div className="bg-blue-50 px-2 py-1 rounded">Container Orchestration</div>
            <div className="bg-blue-50 px-2 py-1 rounded">RESTful APIs</div>
            <div className="bg-blue-50 px-2 py-1 rounded">Incident Response</div>
            <div className="bg-blue-50 px-2 py-1 rounded">Service Reliability</div>
          </div>
        </div>
      </section>

      {/* Technical Skills */}
      <section className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">TECHNICAL SKILLS</h3>
        <div className="grid grid-cols-4 gap-6 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Languages</h4>
            <ul className="space-y-1 text-gray-700">
              <li>Go</li>
              <li>Python</li>
              <li>Bash/Shell</li>
              <li>SQL</li>
              <li>TypeScript</li>
              <li>C++</li>
              <li>C</li>
              <li>Rust</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Cloud & Infrastructure</h4>
            <ul className="space-y-1 text-gray-700">
              <li>Google Cloud Platform</li>
              <li>Kubernetes</li>
              <li>Docker</li>
              <li>Terraform</li>
              <li>Infrastructure as Code</li>
              <li>Helm</li>
              <li>GitOps</li>
              <li>CI/CD Pipelines</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Databases & Monitoring</h4>
            <ul className="space-y-1 text-gray-700">
              <li>MongoDB</li>
              <li>PostgreSQL</li>
              <li>Apache Cassandra</li>
              <li>DataDog</li>
              <li>Observability Platforms</li>
              <li>RESTful APIs</li>
              <li>Web Applications</li>
              <li>Performance Monitoring</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Specializations</h4>
            <ul className="space-y-1 text-gray-700">
              <li>Site Reliability Engineering</li>
              <li>DevOps</li>
              <li>Microservices Architecture</li>
              <li>High Availability Systems</li>
              <li>Disaster Recovery</li>
              <li>Incident Response</li>
              <li>Automation</li>
              <li>Load Balancing</li>
              <li>Scalability</li>
              <li>System Performance Optimization</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Professional Development */}
      <section className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">PROFESSIONAL DEVELOPMENT</h3>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Currently Pursuing:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Google Cloud Professional DevOps Engineer</li>
              <li>• Certified Kubernetes Administrator (CKA)</li>
              <li>• AWS Solutions Architect Associate</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Professional Development:</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Site Reliability Engineering Fundamentals</li>
              <li>• Infrastructure as Code with Terraform</li>
              <li>• Kubernetes Production Best Practices</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Experience */}
      <section className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">PROFESSIONAL EXPERIENCE</h3>

        {/* Site Reliability Engineer */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-semibold text-gray-900">Site Reliability Engineer</h4>
            <span className="text-sm text-gray-600">Jan 2024 – Present</span>
          </div>

          <ul className="text-sm text-gray-800 space-y-2 ml-4">
            <li>• <strong>Deployed and maintained observability platform</strong> using DataDog, establishing 15+ custom dashboards and automated alerts that reduced mean time to detection (MTTD) by 40% and enabled rapid error detection and remediation across distributed microservices architecture</li>

            <li>• <strong>Partnered across development, operations, and QA teams</strong> to architect and execute critical MongoDB migration of 60+ billion documents, ensuring service reliability and scalability while maintaining 99.9% SLA compliance through comprehensive testing and automated scripts</li>

            <li>• <strong>Developed automated remediation systems</strong> using Python and Bash scripting, creating monitoring and analysis tools that improved system performance by 20% and reduced manual intervention for common service-impacting issues</li>

            <li>• <strong>Provided guidance to 8+ engineers and developers</strong> on reliability best practices, implementing standardized trouble-shooting procedures and incident response protocols that increased service performance expectations and team efficiency</li>

            <li>• <strong>Participated in on-call rotations</strong> for mission-critical financial services infrastructure handling 1M+ daily transactions, leading restoration and repair of service-impacting issues while maintaining zero data loss record</li>
          </ul>
        </div>

        {/* Software Engineer Intern */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-semibold text-gray-900">Software Engineer Intern</h4>
            <span className="text-sm text-gray-600">Jul 2023 – Dec 2023</span>
          </div>

          <ul className="text-sm text-gray-800 space-y-2 ml-4">
            <li>• <strong>Delivered high-quality software solutions</strong> in dual Developer/QA role, executing comprehensive testing strategies that reduced production bugs by 25% and accelerated release cycles through automated testing scripts</li>

            <li>• <strong>Engineered database solutions</strong> using SQL Server Management Studio (SSMS) and T-SQL, optimizing query performance by 40% and developing 10+ custom forms using C# and VB.NET for enterprise applications</li>

            <li>• <strong>Streamlined development workflows</strong> using Azure DevOps, implementing CI/CD pipelines and Git version control that improved team productivity by 30% and reduced deployment errors by 60%</li>
          </ul>
        </div>

        {/* Computer Science Co-Tutoring Coordinator */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-semibold text-gray-900">Computer Science Co-Tutoring Coordinator</h4>
            <span className="text-sm text-gray-600">Jun 2022 – Dec 2022</span>
          </div>

          <ul className="text-sm text-gray-800 space-y-2 ml-4">
            <li>• <strong>Mentored 50+ computer science students</strong> in algorithms, data structures, and programming fundamentals, improving student success rates by 25% through personalized debugging and code review sessions</li>

            <li>• <strong>Diagnosed and resolved complex technical issues</strong> including compiler errors, runtime bugs, and performance bottlenecks across multiple programming languages (C++, Python, Java)</li>

            <li>• <strong>Facilitated collaborative learning environments</strong> by leading group tutoring sessions and developing standardized troubleshooting methodologies for common programming challenges</li>

            <li>• <strong>Enhanced technical communication skills</strong> by translating complex algorithmic concepts into accessible explanations, demonstrating ability to bridge technical and non-technical stakeholders</li>
          </ul>
        </div>

        {/* Supply Coordinating Manager */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-semibold text-gray-900">Supply Coordinating Manager</h4>
            <span className="text-sm text-gray-600">Nov 2021 – Jun 2022</span>
          </div>

          <ul className="text-sm text-gray-800 space-y-2 ml-4">
            <li>• <strong>Automated data analysis workflows</strong> using SQL and custom scripts, streamlining regulatory compliance processes and reducing manual reporting time by 50%</li>

            <li>• <strong>Managed enterprise database systems</strong> (CMMS) for supply chain operations, ensuring data integrity and optimizing query performance for 100+ daily users</li>

            <li>• <strong>Led cross-functional facility improvement projects</strong> with budgets exceeding $500K, coordinating between engineering, operations, and compliance teams to deliver on-time results</li>

            <li>• <strong>Developed training programs</strong> for 20+ employees on database software and operational procedures, improving team efficiency and reducing onboarding time by 40%</li>
          </ul>
        </div>

        {/* Technology Coordinator & Curriculum Developer */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-semibold text-gray-900">Technology Coordinator & Curriculum Developer</h4>
            <span className="text-sm text-gray-600">Sep 2018 – Jan 2022</span>
          </div>

          <ul className="text-sm text-gray-800 space-y-2 ml-4">
            <li>• <strong>Architected and implemented</strong> comprehensive coding curriculum for 200+ students across K-8 grades, introducing Python programming and web development fundamentals that increased K-8 technology engagement by 80%</li>

            <li>• <strong>Led technology infrastructure modernization,</strong> managing hardware procurement, software deployment, and system administration for 25+ faculty members while reducing IT support requests by 45%</li>

            <li>• <strong>Designed and delivered technical training programs</strong> for cross-functional teams, improving staff technology proficiency by 40% and establishing standardized workflows for educational technology integration</li>

            <li>• <strong>Evaluated and optimized</strong> institutional technology stack, conducting needs assessments and budget planning that resulted in 30% cost reduction while improving system reliability and performance</li>
          </ul>
        </div>
      </section>

      {/* Education */}
      <section className="mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">EDUCATION</h3>

        <div className="mb-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-semibold text-gray-900">Portland State University</h4>
            <span className="text-sm text-gray-600">Expected 2025</span>
          </div>
          <p className="text-sm text-gray-700 mb-2">Bachelor of Science in Computer Science</p>
          <p className="text-sm text-gray-600">Focus: Data Structures, Algorithms, and Systems Programming</p>
        </div>

        <div>
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-lg font-semibold text-gray-900">Portland Community College</h4>
            <span className="text-sm text-gray-600">2020</span>
          </div>
          <p className="text-sm text-gray-700">Associate of Science Transfer Degree</p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center pt-6 border-t border-gray-300">
        <p className="text-sm text-gray-600">
          Ready to discuss opportunities and contribute to your team's success
        </p>
      </section>
    </div>
  )
}