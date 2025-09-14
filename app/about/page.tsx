import { Metadata } from 'next'
import Image from 'next/image'
import BackgroundAnimation from '../components/BackgroundAnimation'
import PhotographyGallery from '../components/PhotographyGallery'
import PerformanceMetrics from '../components/PerformanceMetrics'

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

        {/* Personal Highlights - Focus on character and soft skills */}
        <section className="mb-16">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-10 text-center">What Drives Me</h3>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-2xl">
                <div className="flex items-start mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Educator at Heart</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      4+ years teaching mathematics shaped my approach to complex problems. I believe the best solutions are the ones everyone can understand and build upon.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10 p-6 rounded-2xl">
                <div className="flex items-start mb-4">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Strategic Collaborator</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      From chess strategy to team dynamics, I thrive on building bridges between different perspectives and finding win-win solutions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 p-6 rounded-2xl">
                <div className="flex items-start mb-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Growth Mindset</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      Every challenge is a learning opportunity. I&apos;m comfortable saying &quot;I don&apos;t know&quot; and excited to figure it out together with the team.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50/50 to-red-50/50 dark:from-orange-900/10 dark:to-red-900/10 p-6 rounded-2xl">
                <div className="flex items-start mb-4">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mr-4 mt-1 flex-shrink-0">
                    <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-10V3m0 3V3m0 0V1m0 2h4M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Community Builder</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      Whether coaching pickleball or leading engineering initiatives, I love creating environments where people can do their best work.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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

        {/* Performance Metrics */}
        <section className="mb-16">
          <PerformanceMetrics />
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

        {/* Built With - Technical Stack Showcase */}
        <section className="mb-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Built With</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                This portfolio demonstrates modern SRE practices and infrastructure expertise through its technical implementation
              </p>
            </div>

            {/* Tech Stack Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Frontend & Framework */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 8.16c-.169-.477-.423-.834-.76-1.067l-.076-.053c-.235-.163-.563-.25-.985-.26h-.016c-.6-.014-1.322.086-2.095.283-.776.2-1.57.49-2.297.84a7.245 7.245 0 00-1.954 1.308c-.558.515-1.012 1.106-1.302 1.746-.29.64-.42 1.296-.37 1.943.05.648.244 1.267.552 1.807.307.54.72.978 1.207 1.285.488.307 1.034.475 1.596.486.562.01 1.135-.134 1.675-.414.54-.279 1.021-.675 1.414-1.148.393-.473.688-1.009.866-1.578.178-.568.235-1.154.169-1.716-.066-.562-.243-1.091-.516-1.555zm-4.14 6.259c-.435-.307-.815-.7-1.12-1.155-.306-.455-.53-.965-.66-1.503-.13-.537-.164-1.09-.1-1.632.064-.542.209-1.067.428-1.546.219-.479.501-.915.831-1.286.33-.371.703-.674 1.1-.894.396-.22.82-.355 1.25-.397.43-.042.86.002 1.27.13.41.128.793.345 1.13.64.337.294.618.657.83 1.068.212.41.352.857.414 1.315.062.458.043.92-.055 1.361-.098.441-.263.86-.486 1.234-.223.374-.498.7-.812.96-.314.26-.665.45-1.035.559-.37.109-.755.134-1.135.074-.38-.06-.745-.198-1.075-.413z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Next.js 15</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  App Router architecture with server-side rendering for optimal performance and SEO
                </p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">React 18</span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">TypeScript</span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">SSR</span>
                </div>
              </div>

              {/* Styling & UI */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tailwind CSS</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Utility-first styling with responsive design and dark/light theme support
                </p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded text-xs">Responsive</span>
                  <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded text-xs">Dark Mode</span>
                  <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded text-xs">PostCSS</span>
                </div>
              </div>

              {/* Analytics & Monitoring */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Google Analytics</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Privacy-focused analytics with custom event tracking and performance monitoring
                </p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">GA4</span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">Privacy</span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">Events</span>
                </div>
              </div>

              {/* Deployment & CI/CD */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GitHub Pages</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Automated deployment with GitHub Actions CI/CD pipeline and custom domain
                </p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">Actions</span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">CI/CD</span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">Static</span>
                </div>
              </div>

              {/* Performance & Optimization */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Optimized images, lazy loading, static generation, and efficient caching strategies
                </p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs">SSG</span>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs">Lazy Load</span>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs">Cache</span>
                </div>
              </div>

              {/* Development & Tooling */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Developer Tools</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Modern development workflow with ESLint, hot reload, and type safety
                </p>
                <div className="flex flex-wrap gap-1">
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs">ESLint</span>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs">Hot Reload</span>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs">Git</span>
                </div>
              </div>
            </div>

            {/* SRE Principles Applied */}
            <div className="bg-gradient-to-br from-slate-50/80 to-gray-50/80 dark:from-slate-900/40 dark:to-gray-900/40 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">SRE Principles Applied</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Reliability</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Static generation ensures 99.9% uptime with GitHub Pages infrastructure</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-gray-900 dark:text-white mb-2">Performance</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Optimized for Core Web Vitals with sub-second load times globally</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Monitoring</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Comprehensive analytics and performance tracking for data-driven improvements</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Automation</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Fully automated deployment pipeline with testing and quality checks</p>
                </div>
              </div>
            </div>
          </div>
        </section>

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