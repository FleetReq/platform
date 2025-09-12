import { Metadata } from 'next'
import Image from 'next/image'
import BackgroundAnimation from '../components/BackgroundAnimation'

export const metadata: Metadata = {
  title: 'About - Bruce Truong',
  description: 'Learn more about Bruce Truong, Full Stack Developer and Software Engineer with expertise in React, Node.js, and modern web technologies.',
  openGraph: {
    title: 'About Bruce Truong',
    description: 'Learn more about Bruce Truong, Full Stack Developer and Software Engineer.',
    url: 'https://brucetruong.com/about',
  },
  twitter: {
    title: 'About Bruce Truong',
    description: 'Learn more about Bruce Truong, Full Stack Developer and Software Engineer.',
  },
}

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden min-h-screen">
      <BackgroundAnimation />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            About Me
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Site Reliability Engineer with strong technical foundations and exceptional communication skills, eager to contribute to resilient systems and collaborative teams
          </p>
        </div>

        <div className="mb-16">
          <div className="relative">
            {/* Floating image on the right */}
            <div className="md:float-right md:ml-8 md:mb-6 mb-8 md:w-80 w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/about-profile.jpg"
                  alt="Bruce Truong"
                  width={320}
                  height={400}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            
            {/* Story content that flows around the image */}
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">My Story</h2>
              
              <p className="mb-6 text-lg">
                I&apos;m a Site Reliability Engineer building foundational expertise in resilient, scalable infrastructure systems. 
                My background in education—including 4 years teaching mathematics and extensive tutoring experience—has cultivated 
                a systematic approach to complex problem-solving and knowledge transfer that enhances my technical growth and collaboration.
              </p>
              
              <p className="mb-6 text-lg">
                Developing expertise in cloud platforms, Kubernetes, Go development, and infrastructure automation through hands-on 
                experience and continuous learning. My strength in translating complex technical concepts into clear, actionable insights—honed 
                through years of teaching and coaching—enables effective collaboration across engineering teams and stakeholders.
              </p>
              
              <p className="mb-6 text-lg">
                My communication skills—developed through years of tutoring, coaching athletes, and coordinating team strategy—enhance 
                my ability to collaborate during incident response, participate in post-mortems, and explain technical concepts to peers. 
                Whether learning about distributed systems or coaching pickleball strategy, I focus on making complex ideas clear and actionable.
              </p>
              
              {/* Integrated pickleball photo */}
              <div className="md:float-left md:mr-8 md:mb-4 mb-6 md:w-72 w-full md:clear-none clear-both">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src="/images/pickleball-team.jpeg"
                    alt="Bruce with his pickleball team"
                    width={288}
                    height={200}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
              
              <p className="mb-6 text-lg">
                As former Program Director for Chess Wizards Oregon, I developed systematic approaches to strategic thinking and instruction 
                that directly inform my infrastructure architecture decisions. The analytical frameworks from competitive strategy games, 
                combined with hands-on coaching experience, provide distinctive insights for building fault-tolerant systems and leading 
                high-performing engineering teams.
              </p>
              
              <p className="text-lg">
                I approach challenges with intellectual curiosity and humility—always ready to ask the right questions, adapt when presented 
                with better solutions, and acknowledge when I&apos;ve been wrong. This growth mindset, essential in rapidly evolving 
                infrastructure landscapes, enables me to build systems that truly serve user needs rather than defending predetermined approaches. 
                In SRE work, the best solution wins, regardless of whose idea it was.
              </p>
            </div>
            
            {/* Clear float */}
            <div className="clear-both"></div>
          </div>
        </div>

        {/* Quick Facts in a separate section */}
        <div className="mb-16">
          <div className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">Quick Facts</h3>
            <ul className="grid md:grid-cols-2 gap-4">
              <li className="flex items-center">
                <span className="w-3 h-3 bg-blue-600 rounded-full mr-3 flex-shrink-0"></span>
                <span>Site Reliability Engineer</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-purple-600 rounded-full mr-3 flex-shrink-0"></span>
                <span>Go & Kubernetes Specialist</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-600 rounded-full mr-3 flex-shrink-0"></span>
                <span>Infrastructure Automation Enthusiast</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-red-600 rounded-full mr-3 flex-shrink-0"></span>
                <span>Pickleball Coach & Competitor</span>
              </li>
            </ul>
          </div>
        </div>


        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Constantly exploring new technologies and approaches to solve problems more effectively.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Communication</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Translating complex technical concepts into clear, actionable insights for diverse audiences.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤔</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Intellectual Humility</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Embracing curiosity, asking the right questions, and adapting when better solutions emerge.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Let&apos;s Connect</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            I&apos;m always interested in new opportunities and interesting conversations.
          </p>
          <a
            href="/contact"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
          >
            Get In Touch
          </a>
        </div>
      </div>
    </div>
  )
}