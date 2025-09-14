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