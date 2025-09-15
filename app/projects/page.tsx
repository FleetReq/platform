import { Metadata } from 'next'
import Link from 'next/link'
import BackgroundAnimation from '../components/BackgroundAnimation'
import MileageStatsWidget from '../components/MileageStatsWidget'

export const metadata: Metadata = {
  title: 'Projects - Bruce Truong',
  description: 'Explore projects and work by Bruce Truong, showcasing infrastructure automation, monitoring solutions, and SRE tooling.',
  openGraph: {
    title: 'Projects by Bruce Truong',
    description: 'Explore projects and work by Bruce Truong, showcasing infrastructure automation and SRE solutions.',
    url: 'https://brucetruong.com/projects',
  },
  twitter: {
    title: 'Projects by Bruce Truong',
    description: 'Explore projects and work by Bruce Truong, showcasing infrastructure automation and SRE solutions.',
  },
}

const workExperience = [
  {
    id: 1,
    title: 'MongoDB Atlas Cloud Migration - 60B+ Documents',
    description: 'Architected and executed production migration of 60+ billion documents from on-premises MongoDB to Atlas cloud infrastructure. Developed Python and Bash automation scripts with automated validation, rollback procedures, and achieved zero data loss during the migration.',
    technologies: ['Python', 'Bash/Shell', 'MongoDB', 'Atlas Cloud', 'Automation Scripts'],
    type: 'Professional Work',
    company: 'Apex Fintech Solutions',
    featured: true,
  },
  {
    id: 2,
    title: 'DataDog Observability Platform - 40% MTTD Improvement',
    description: 'Deployed and maintained comprehensive DataDog observability platform with 15+ custom dashboards and automated alerts. Developed automated remediation solutions that improved MTTD by 40% and reduced manual intervention by 30% across distributed microservices architecture.',
    technologies: ['DataDog', 'Python', 'Automated Remediation', 'Custom Dashboards', 'SLA Management'],
    type: 'Professional Work',
    company: 'Apex Fintech Solutions',
    featured: true,
  },
  {
    id: 3,
    title: 'FinTech API Integrations - Charles Schwab & DTCC',
    description: 'Collaborated with Charles Schwab and DTCC to architect RESTful API integrations for Ascend SaaS platform. Ensured reliable connectivity for FinTech operations handling 1M+ daily transactions while maintaining 99.9% SLA compliance.',
    technologies: ['RESTful APIs', 'FinTech Systems', 'SLA Management', 'Financial Services', 'System Integration'],
    type: 'Professional Work',
    company: 'Apex Fintech Solutions',
    featured: false,
  },
  {
    id: 4,
    title: 'Bike Index Platform',
    description: 'Led a 5-member capstone team to develop a platform for creating, editing, and searching through bike theft information. Implemented using Scrum methodology with bi-weekly sprints.',
    technologies: ['Team Leadership', 'Scrum', 'Full Stack Development', 'Database Design'],
    type: 'Personal Project', 
    company: 'PSU Capstone',
    github: 'https://github.com/impeccKable/bike-index-platform',
    featured: false,
  },
  {
    id: 5,
    title: 'Portfolio Website - SRE Implementation Showcase',
    description: 'Comprehensive technical showcase built with modern web technologies and SRE best practices. Features automated CI/CD deployment, performance optimization, and comprehensive monitoring. Demonstrates infrastructure automation, reliability engineering, and full-stack development skills.',
    longDescription: `This portfolio website serves as both a professional showcase and a demonstration of Site Reliability Engineering principles applied to web development. Built with Next.js 15 and TypeScript for type safety, the site implements modern performance optimizations including static site generation, image optimization, and efficient caching strategies.

The deployment pipeline showcases DevOps best practices with automated Vercel deployment integration, ensuring consistent and reliable deployments with custom domain configuration. Privacy-focused Google Analytics 4 integration provides comprehensive monitoring and user insights while respecting visitor privacy.

Key SRE principles demonstrated include: 99.9% uptime through static generation, sub-second load times via CDN distribution, comprehensive analytics for data-driven improvements, and fully automated deployment pipeline with quality checks.`,
    technologies: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Google Analytics 4', 'Vercel', 'Supabase', 'ESLint', 'PostCSS'],
    sre_principles: ['Static Site Generation', 'Performance Monitoring', 'Automated Deployment', 'Error Tracking', 'CDN Distribution'],
    performance_metrics: {
      load_time: '< 800ms',
      first_load_js: '102KB',
      lighthouse: '95+',
      static_pages: '12',
      core_web_vitals: 'Excellent',
      uptime: '99.9%'
    },
    type: 'Personal Project',
    company: 'Technical Showcase',
    github: 'https://github.com/DeeAhTee/my-resume-site',
    demo: 'https://brucetruong.com',
    featured: true,
  },
  {
    id: 6,
    title: 'Gas Mileage & Maintenance Tracker - Full-Stack SRE Portfolio (WIP)',
    description: 'Work-in-progress vehicle tracking application demonstrating full-stack development with SRE principles. Features GitHub OAuth authentication, real-time MPG calculations, maintenance scheduling, and public analytics. Built with Next.js, Supabase, and designed for both web dashboard and Android mobile app integration.',
    longDescription: `A production-ready full-stack application showcasing Site Reliability Engineering skills through practical vehicle management. The system demonstrates database design, API development, authentication, and real-time data processing while maintaining 99.9% uptime targets.

Key technical achievements include: automated MPG calculations with SQL triggers, Row Level Security implementation for multi-tenant data isolation, comprehensive REST API design, and real-time dashboard updates. The architecture supports both web interface and mobile app consumption.

SRE principles applied: automated database backups, comprehensive logging and monitoring, performance optimization through proper indexing, and scalable architecture design supporting future Android app integration.`,
    technologies: ['Next.js 15', 'TypeScript', 'Supabase', 'PostgreSQL', 'REST APIs', 'Row Level Security', 'GitHub OAuth', 'Tailwind CSS', 'SQL Triggers'],
    sre_principles: ['Database Reliability', 'API Performance', 'Security by Design', 'Multi-platform Architecture', 'Real-time Monitoring'],
    performance_metrics: {
      api_response: '< 200ms',
      database_queries: 'Optimized',
      security: 'RLS + OAuth',
      platforms: 'Web + Mobile',
      uptime_target: '99.9%',
      scalability: 'Multi-tenant'
    },
    type: 'Personal Project',
    company: 'Full-Stack Portfolio (WIP)',
    github: 'https://github.com/DeeAhTee/my-resume-site',
    demo: '/mileage',
    featured: true,
  },
]

export default function ProjectsPage() {
  const featuredProjects = workExperience.filter(project => project.featured)
  const otherProjects = workExperience.filter(project => !project.featured) 

  return (
    <div className="relative overflow-hidden min-h-screen">
      <BackgroundAnimation />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Experience
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Professional SRE work and personal projects showcasing infrastructure automation, monitoring, and system reliability
          </p>
        </div>

        {/* Featured Experience */}
        <section className="mb-16 py-12 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="px-8">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Featured Experience</h2>
            <div className="grid md:grid-cols-2 gap-8">
            {featuredProjects.map((project) => (
              <div
                key={project.id}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 p-6 ${
                  project.id === 5 || project.id === 6 ? 'md:col-span-2' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    project.type === 'Professional Work' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  }`}>
                    {project.type}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{project.company}</span>
                </div>
                
                <h3 className="text-2xl font-bold mb-4">{project.title}</h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {project.description}
                </p>

                {/* Extended content for portfolio projects */}
                {(project.id === 5 || project.id === 6) && project.longDescription && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Technical Implementation:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                      {project.longDescription}
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Technologies Used:</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* SRE Principles for portfolio projects */}
                {(project.id === 5 || project.id === 6) && project.sre_principles && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">SRE Principles Applied:</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.sre_principles.map((principle) => (
                        <span
                          key={principle}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
                        >
                          {principle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Metrics for portfolio projects */}
                {(project.id === 5 || project.id === 6) && project.performance_metrics && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Key Performance Metrics:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{project.performance_metrics.load_time}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Load Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{project.performance_metrics.first_load_js}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">First Load JS</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{project.performance_metrics.lighthouse}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Lighthouse</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{project.performance_metrics.static_pages}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Static Pages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{project.performance_metrics.core_web_vitals}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Core Web Vitals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{project.performance_metrics.uptime}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Uptime SLA</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Stats Widget for Mileage Tracker */}
                {project.id === 5 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Live Application Data:</h4>
                    <MileageStatsWidget />
                  </div>
                )}

                {project.type === 'Personal Project' && (
                  <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                        </svg>
                        GitHub
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target={project.demo.startsWith('http') ? "_blank" : "_self"}
                        rel={project.demo.startsWith('http') ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Demo
                      </a>
                    )}
                  </div>
                )}
                
                {project.type === 'Professional Work' && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      * Proprietary work - source code not available for public viewing
                    </p>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        </section>

        {/* Other Projects */}
        <section className="mb-16 py-12 bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="px-8">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">More Projects</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-xl font-bold mb-3">{project.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                      +{project.technologies.length - 3} more
                    </span>
                  )}
                </div>
                {project.type === 'Personal Project' && (
                  <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                        </svg>
                        GitHub
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Demo
                      </a>
                    )}
                  </div>
                )}
                
                {project.type === 'Professional Work' && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      * Proprietary work - source code not available for public viewing
                    </p>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Interested in Working Together?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            I&apos;m always open to discussing new projects, creative ideas, or opportunities to collaborate.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Get In Touch
          </Link>
        </div>
      </div>
    </div>
  )
}