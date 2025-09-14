import { Metadata } from 'next'
import Image from 'next/image'
import BackgroundAnimation from '../components/BackgroundAnimation'
// import PhotographyGallery from '../components/PhotographyGallery'

export const metadata: Metadata = {
  title: 'About - Bruce Truong',
  description: 'Learn more about Bruce Truong, Software Engineer with a passion for teaching, community building, and capturing authentic moments through photography.',
  openGraph: {
    title: 'About Bruce Truong',
    description: 'Learn more about Bruce Truong, Software Engineer, educator, and community leader.',
    url: 'https://brucetruong.com/about',
  },
  twitter: {
    title: 'About Bruce Truong',
    description: 'Learn more about Bruce Truong, Software Engineer, educator, and community leader.',
  },
}

export default function AboutPage() {
  // Photography data - removed unused variables

  return (
    <div className="relative overflow-hidden min-h-screen">
      <BackgroundAnimation />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            About Me
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Software Engineer, educator at heart, and community builder who brings curiosity, strategic thinking, and genuine human connection to everything I do
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
                I&apos;m a Software Engineer who discovered my love for teaching at an early age—even in 4th grade, I was helping
                classmates with their math homework. This passion led me through roles as a chess instructor (complete with wizard costume),
                a mathematics teacher at Holy Trinity Catholic School where students nicknamed me &quot;Batman,&quot; and eventually into
                software engineering where I continue to find joy in making complex concepts accessible.
              </p>

              <p className="mb-6 text-lg">
                My teaching philosophy has always been simple: meet people where they are and show them why it matters. I remember
                explaining exponents through Minecraft&apos;s stack limit of 64—the kids went absolutely wild with excitement about math.
                Some students even came up afterward wanting to create their own lessons connecting area calculations to Minecraft blocks.
                This ability to bridge the gap between complex ideas and real-world applications drives my approach to software engineering.
              </p>

              <p className="mb-6 text-lg">
                Currently, I&apos;m diving deep into strategic thinking through books like Modern Poker Theory and The Pickleball Mindset,
                while serving as a Six Zero pickleball ambassador and coaching local players. Named after Bruce Lee, I practice martial arts
                and embrace the philosophy of continuous improvement—whether debugging code, perfecting a serve, or volunteering at the
                Oregon Food Bank where my personal experience with homelessness helps me connect authentically with those we serve.
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
                At Holy Trinity, I became so beloved by students that eating lunch with me became a coveted privilege—even kids who&apos;d
                never been in my class would work to earn that opportunity. The secret wasn&apos;t just making learning fun; it was making
                every single student feel heard and valued. When the school needed fundraising, I didn&apos;t hesitate to dress up as Batman
                and run through the neighborhood, because sometimes the best solutions require a little creativity and a lot of heart.
              </p>

              <p className="text-lg">
                I approach challenges with intellectual curiosity and humility—always ready to ask the right questions, adapt when presented
                with better solutions, and acknowledge when I&apos;ve been wrong. This growth mindset, whether applied to mastering a new
                programming language, analyzing poker hands, or perfecting pickleball strategy, enables me to build solutions that truly
                serve people&apos;s needs rather than defending predetermined approaches. The best idea wins, regardless of whose it was.
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
                      From helping classmates in 4th grade to teaching as a wizard chess instructor and beloved &quot;Batman&quot; math teacher, I believe the best solutions are the ones everyone can understand and build upon.
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
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Strategic Thinker</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      From chess and poker strategy to pickleball coaching and martial arts training, I apply analytical frameworks and strategic thinking to solve complex problems creatively.
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
                      As a Six Zero ambassador, pickleball coach, and Oregon Food Bank volunteer, I love creating environments where people feel valued and can do their best work.
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

        {/* Photography Section */}
        <section className="mb-16 py-12 bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          <div className="px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Through My Lens</h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                I love capturing people when their genuine emotions are shining—not when they&apos;re posing.
                Photography is my way of memorializing the small events that are incredibly powerful,
                preserving those authentic moments that tell the real story.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 max-w-2xl mx-auto text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-orange-200 dark:from-pink-900/50 dark:to-orange-800/50 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Authentic Moments</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                Each photograph captures a genuine emotion, an unguarded smile, or a candid interaction that reveals the true essence of the moment.
                These are the memories that matter most.
              </p>
              <a
                href="https://www.instagram.com/deeahtee/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                View My Photography
              </a>
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