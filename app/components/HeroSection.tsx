import Link from 'next/link'
import Image from 'next/image'

export default function HeroSection() {
  return (
    <section id="hero" className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          {/* Profile Image */}
          <div className="flex-shrink-0 group relative">
            {/* Subtle background glow */}
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            {/* Main image container */}
            <div className="relative w-72 h-72 lg:w-96 lg:h-96">
              {/* Enhanced gradient border ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-1.5 shadow-elegant-xl">
                {/* Inner shadow ring with better contrast */}
                <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-3 transition-all duration-500 shadow-inner">
                  {/* Image container with better shadows */}
                  <div className="w-full h-full rounded-full overflow-hidden ring-1 ring-gray-200/50 dark:ring-gray-700/50">
                    <Image
                      src="/images/profile.jpg"
                      alt="Bruce Truong - Site Reliability Engineer"
                      width={384}
                      height={384}
                      className="w-full h-full object-cover filter group-hover:brightness-105 group-hover:contrast-105 transition-all duration-500"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced professional badge */}
              <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full border-4 border-white dark:border-gray-900 shadow-elegant-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="mb-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                <span className="animate-fade-in-up block">Bruce</span>
                <span className="animate-fade-in-up-delayed block text-blue-600 dark:text-blue-400">Truong</span>
              </h1>
              <div className="h-1.5 w-32 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 mx-auto lg:mx-0 mb-6 rounded-full animate-scale-in"></div>
            </div>

            <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-3 animate-slide-in-left">
              Site Reliability Engineer
            </p>

            <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-200 mb-8 font-medium leading-relaxed animate-slide-in-right">
              Building resilient systems that scale with confidence
            </p>

            <p className="text-lg text-gray-600 dark:text-gray-300 mb-10 max-w-2xl leading-loose mx-auto lg:mx-0 animate-fade-in-up" style={{ animationDelay: '0.6s', animationFillMode: 'both', opacity: 0 }}>
              Transforming complex infrastructure challenges into scalable solutions.
              Specialized in cloud migration, automation, and high-availability systems
              with <strong className="text-gradient-secondary font-bold">60+ billion documents</strong> successfully migrated to production.
            </p>
            
            {/* Core Skills */}
            <div className="mb-10 animate-fade-in-up" style={{ animationDelay: '0.8s', animationFillMode: 'both', opacity: 0 }}>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6 text-center lg:text-left">Core Technologies</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto lg:mx-0">
                {[
                  { name: "Go", icon: "🔷", color: "from-blue-500 to-blue-600" },
                  { name: "Kubernetes", icon: "⚡", color: "from-purple-500 to-purple-600" },
                  { name: "MongoDB", icon: "🍃", color: "from-green-500 to-green-600" },
                  { name: "GCP", icon: "☁️", color: "from-blue-600 to-indigo-600" },
                  { name: "Python", icon: "🐍", color: "from-green-600 to-emerald-600" },
                  { name: "Docker", icon: "🐋", color: "from-cyan-500 to-blue-500" },
                  { name: "Terraform", icon: "🏗️", color: "from-orange-500 to-orange-600" },
                  { name: "DataDog", icon: "📊", color: "from-violet-500 to-violet-600" }
                ].map((skill, index) => (
                  <div
                    key={skill.name}
                    className="group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-4 py-3 rounded-full border border-gray-200/60 dark:border-gray-700/60 shadow-elegant hover:shadow-elegant-lg hover:-translate-y-1 transition-all duration-300 cursor-default animate-scale-in"
                    style={{ animationDelay: `${0.9 + index * 0.1}s`, animationFillMode: 'both', opacity: 0 }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${skill.color} opacity-0 group-hover:opacity-10 rounded-full transition-opacity duration-300`}></div>
                    <div className="relative flex items-center justify-center">
                      <span className="text-lg mr-2 group-hover:scale-110 transition-transform duration-300">{skill.icon}</span>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300 whitespace-nowrap">{skill.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Achievement Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
              {[
                { value: "60B+", label: "Documents Migrated", delay: "0ms" },
                { value: "5+", label: "Years Experience", delay: "200ms" },
                { value: "99.9%", label: "System Uptime", delay: "400ms" }
              ].map((stat, index) => (
                <div 
                  key={stat.label}
                  className={`text-center group cursor-default animate-fade-in-up ${index === 2 ? 'sm:col-span-1 col-span-2' : ''}`}
                  style={{ animationDelay: stat.delay, animationFillMode: 'both' }}
                >
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110 group-hover:text-blue-700 dark:group-hover:text-blue-300 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-300 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10 animate-fade-in-up" style={{ animationDelay: '1.4s', animationFillMode: 'both', opacity: 0 }}>
              <Link
                href="/resume"
                className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 inline-flex items-center justify-center shadow-elegant-lg hover:shadow-elegant-xl transform hover:-translate-y-2 hover:scale-105 focus-visible-ring overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg className="mr-3 w-5 h-5 transition-transform group-hover:scale-110 group-hover:rotate-6 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                <span className="relative z-10">View Full Resume</span>
                <svg className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>

              <Link
                href="/contact"
                className="group relative border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-gray-900 px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-elegant hover:shadow-elegant-lg transform hover:-translate-y-2 hover:scale-105 group inline-flex items-center justify-center focus-visible-ring overflow-hidden"
              >
                <div className="absolute inset-0 bg-blue-600 dark:bg-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                <svg className="mr-3 w-5 h-5 transition-transform group-hover:scale-110 group-hover:-rotate-6 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="relative z-10">Let&apos;s Connect</span>
              </Link>
            </div>
            
            {/* Social Links */}
            <div className="flex justify-center lg:justify-start space-x-6">
              <a
                href="mailto:careers@brucetruong.com"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 hover:-translate-y-1 group"
                aria-label="Email"
              >
                <svg className="w-6 h-6 transition-all duration-300 group-hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/brucentruong/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 hover:-translate-y-1 group"
                aria-label="LinkedIn"
              >
                <svg className="w-6 h-6 transition-all duration-300 group-hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://github.com/DeeAhTee"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110 hover:-translate-y-1 group"
                aria-label="GitHub"
              >
                <svg className="w-6 h-6 transition-all duration-300 group-hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/deeahtee/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 transition-all duration-300 hover:scale-110 hover:-translate-y-1 group"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6 transition-all duration-300 group-hover:rotate-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C7.284 0 6.944.012 5.877.06 4.814.107 4.086.277 3.45.525a5.566 5.566 0 00-2.01 1.308A5.566 5.566 0 00.133 3.842C-.115 4.477-.285 5.205-.332 6.268-.38 7.334-.392 7.674-.392 10.388s.012 3.054.06 4.12c.047 1.064.217 1.791.465 2.428a5.566 5.566 0 001.308 2.01 5.566 5.566 0 002.009 1.307c.636.248 1.364.418 2.427.465 1.067.048 1.407.06 4.121.06s3.054-.012 4.12-.06c1.064-.047 1.791-.217 2.428-.465a5.566 5.566 0 002.01-1.308 5.566 5.566 0 001.307-2.009c.248-.636.418-1.364.465-2.427.048-1.067.06-1.407.06-4.121s-.012-3.054-.06-4.12C19.715 4.205 19.545 3.477 19.297 2.841a5.566 5.566 0 00-1.308-2.01A5.566 5.566 0 0015.98.525C15.344.277 14.616.107 13.553.06 12.486.012 12.146 0 9.432 0H10zm-.568 1.8h.568c2.67 0 2.987.01 4.041.058.975.045 1.505.207 1.858.344.467.182.8.399 1.15.748.35.35.566.683.748 1.15.137.353.3.883.344 1.857.048 1.055.058 1.371.058 4.041 0 2.67-.01 2.986-.058 4.04-.045.975-.207 1.505-.344 1.858a3.097 3.097 0 01-.748 1.15c-.35.35-.683.566-1.15.748-.353.137-.883.3-1.857.344-1.054.048-1.37.058-4.041.058-2.67 0-2.987-.01-4.04-.058-.975-.045-1.505-.207-1.858-.344a3.097 3.097 0 01-1.15-.748 3.097 3.097 0 01-.748-1.15c-.137-.353-.3-.883-.344-1.857-.048-1.055-.058-1.371-.058-4.041 0-2.67.01-2.986.058-4.04.045-.975.207-1.505.344-1.858.182-.467.399-.8.748-1.15.35-.35.683-.566 1.15-.748.353-.137.883-.3 1.857-.344C6.444 1.81 6.761 1.8 9.432 1.8zm0 3.058a5.142 5.142 0 100 10.284 5.142 5.142 0 000-10.284zm0 8.484a3.342 3.342 0 110-6.684 3.342 3.342 0 010 6.684zm5.338-8.87a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
            
            {/* Status & Location */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-center lg:justify-start mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Open to new opportunities</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                📍 Beaverton, OR • 📞 971.444.8816
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}