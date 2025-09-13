import { Metadata } from 'next'
import Image from 'next/image'
import BackgroundAnimation from '../components/BackgroundAnimation'
import PhotographyGallery from '../components/PhotographyGallery'

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
  // Photography data - currently empty until you add your photos
  // To enable: add photos to /public/images/photography/ and uncomment below
  const samplePhotos: Array<{id: string; src: string; alt: string; caption?: string; instagramUrl?: string}> = [
    {
      id: '1',
      src: '/images/photography/bee-orchid.jpg',
      alt: 'Bee orchid flower in natural setting'
    },
    {
      id: '2', 
      src: '/images/photography/bird-branch.jpg',
      alt: 'Bird perched on tree branch'
    },
    {
      id: '3',
      src: '/images/photography/deer-forage.jpg', 
      alt: 'Deer foraging in natural habitat'
    },
    {
      id: '4',
      src: '/images/photography/squirrel-fly.jpg',
      alt: 'Squirrel in mid-leap between trees'
    },
    {
      id: '5',
      src: '/images/photography/water-lantern.jpg',
      alt: 'Illuminated lantern reflected in water'
    },
    {
      id: '6',
      src: '/images/photography/dance-performance.jpg',
      alt: 'Dance performance captured in motion'
    },
    {
      id: '7',
      src: '/images/photography/volleyball-spike.jpg',
      alt: 'Volleyball player executing spike'
    },
    {
      id: '8',
      src: '/images/photography/beer-glow.jpg',
      alt: 'Atmospheric beverage photography'
    },
    {
      id: '9',
      src: '/images/photography/girl-climb.jpg',
      alt: 'Climber ascending rock face'
    }
  ]

  return (
    <div className="relative overflow-hidden min-h-screen">
      <BackgroundAnimation />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            About Me
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Site Reliability Engineer with strong technical foundations and exceptional communication skills, eager to contribute to resilient systems and collaborative teams
          </p>
        </div>

        <section className="mb-16 py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="relative px-8">
            {/* Floating image on the right */}
            <div className="md:float-right md:ml-8 md:mb-6 mb-8 md:w-80 w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200/30 dark:border-gray-700/30">
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
        </section>

        {/* Quick Facts in a separate section */}
        <section className="mb-16 py-12 bg-gradient-to-r from-gray-50/80 to-blue-50/80 dark:from-gray-800/40 dark:to-blue-900/20 backdrop-blur-sm rounded-2xl">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-2xl max-w-2xl mx-auto shadow-lg border border-gray-200/50 dark:border-gray-700/50">
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
        </section>

        <section className="mb-16 py-12 bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="px-8">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Core Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-blue-200/50 dark:border-blue-700/50 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Innovation</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Constantly exploring new technologies and approaches to solve problems more effectively.
                </p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-purple-200/50 dark:border-purple-700/50 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Communication</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Translating complex technical concepts into clear, actionable insights for diverse audiences.
                </p>
              </div>
              <div className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border border-green-200/50 dark:border-green-700/50 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Intellectual Humility</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Embracing curiosity, asking the right questions, and adapting when better solutions emerge.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Photography Section - Only show if photos are available */}
        {samplePhotos.length > 0 && (
          <PhotographyGallery 
            photos={samplePhotos}
            title="Through My Lens"
            subtitle="Capturing moments that inspire and tell stories"
            instagramHandle="deeahtee"
          />
        )}

        {/* Call to Action */}
        <section className="mt-16 py-12 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="text-center max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Ready to Collaborate?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              I&apos;m always open to discussing new opportunities, technical challenges, and innovative projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get In Touch
                <svg className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </a>
              
              <a
                href="/resume"
                className="border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-gray-900 px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                View Resume
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}