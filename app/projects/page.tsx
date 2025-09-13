import { Metadata } from 'next'
import Link from 'next/link'
import BackgroundAnimation from '../components/BackgroundAnimation'

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
    title: 'Production Infrastructure Monitoring',
    description: 'Maintained and enhanced monitoring systems for high-scale production environments. Worked with Kubernetes clusters, configured DataDog dashboards, and participated in incident response for systems handling billions of operations.',
    technologies: ['Kubernetes', 'DataDog', 'GCP', 'MongoDB', 'Kafka'],
    type: 'Professional Work',
    company: 'Production SRE Role',
    featured: true,
  },
  {
    id: 2,
    title: 'Message Queue Infrastructure',
    description: 'Supported message processing systems using Kafka, RabbitMQ, and IBM MQ. Assisted with capacity planning, performance monitoring, and troubleshooting connectivity issues across distributed systems.',
    technologies: ['Kafka', 'RabbitMQ', 'IBM MQ', 'Go', 'PostgreSQL'],
    type: 'Professional Work',
    company: 'Production SRE Role',
    featured: true,
  },
  {
    id: 3,
    title: 'Infrastructure as Code',
    description: 'Collaborated on Infrastructure as Code initiatives using Terraform and Helm. Contributed to deployment automation and configuration management for cloud-native applications.',
    technologies: ['Terraform', 'Helm', 'GitHub Actions', 'Docker', 'Ubuntu'],
    type: 'Professional Work',
    company: 'Production SRE Role',
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
    title: 'Personal Portfolio Site',
    description: 'Built and deployed this portfolio website using modern web technologies and CI/CD best practices. Showcases technical skills while demonstrating infrastructure automation concepts.',
    technologies: ['Next.js', 'TypeScript', 'Tailwind CSS', 'GitHub Actions'],
    type: 'Personal Project',
    company: 'Open Source',
    github: 'https://github.com/DeeAhTee/my-resume-site',
    demo: 'https://brucetruong.com',
    featured: false,
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
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 p-6"
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
                
                {project.type === 'Personal Project' && (
                  <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span>🔗</span>
                        Source Code
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        <span>🚀</span>
                        Live Site
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
                  <div className="flex gap-4">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        GitHub
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
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