import { Metadata } from 'next'
import BackgroundAnimation from '../components/BackgroundAnimation'
import ContactForm from '../components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact - Bruce Truong',
  description: 'Get in touch with Bruce Truong for collaboration opportunities, project inquiries, or just to say hello.',
  openGraph: {
    title: 'Contact Bruce Truong',
    description: 'Get in touch for collaboration opportunities and project inquiries.',
    url: 'https://brucetruong.com/contact',
  },
  twitter: {
    title: 'Contact Bruce Truong',
    description: 'Get in touch for collaboration opportunities and project inquiries.',
  },
}

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden min-h-screen">
      <BackgroundAnimation />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Let&apos;s Connect
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            I&apos;m always interested in discussing new opportunities, collaborating on interesting projects, or just having a good conversation about technology and infrastructure.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Contact Info */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-8">Get in Touch</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Whether you&apos;re looking to collaborate on a project, have a job opportunity, or just want to connect, I&apos;d love to hear from you.
            </p>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-xl">📧</span>
                </div>
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <a
                    href="mailto:careers@brucetruong.com"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    careers@brucetruong.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-xl">💼</span>
                </div>
                <div>
                  <h3 className="font-semibold">LinkedIn</h3>
                  <a
                    href="https://linkedin.com/in/brucetruong"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    linkedin.com/in/brucetruong
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-xl">🐙</span>
                </div>
                <div>
                  <h3 className="font-semibold">GitHub</h3>
                  <a
                    href="https://github.com/brucetruong"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-400 hover:underline"
                  >
                    github.com/brucetruong
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                  <span className="text-xl">📸</span>
                </div>
                <div>
                  <h3 className="font-semibold">Instagram</h3>
                  <a
                    href="https://www.instagram.com/deeahtee/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 dark:text-pink-400 hover:underline"
                  >
                    @deeahtee
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
              <h3 className="font-semibold mb-2">Response Time</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                I typically respond to messages within 24-48 hours. For urgent matters, email is the fastest way to reach me.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}