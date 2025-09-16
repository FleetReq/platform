import TestimonialCarousel from './TestimonialCarousel'

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Bryan Hance",
      title: "Co-founder, BikeIndex.org",
      company: "Stolen Bicycle Registry",
      content: "The final product is several times more amazing than what I asked for. The team not only met my specifications, but they were able to come up with all kinds of improvements and additions I never even thought of. It was truly a pleasure working with this crew and seeing them tackle this project and work with them to refine it into the final end product that we are putting into production today.",
      project: "Bike Index Platform",
      highlight: "The team absolutely knocked it out of the park!",
      articleLink: "https://bikeindex.org/news/bike-indexs-new-tool-in-the-fight-against-bike-crimes"
    },
    {
      id: 2,
      name: "Cristian Salazar",
      title: "Software Engineering Student",
      company: "Portland State University",
      content: "Unlike other project managers I've worked with, Bruce approaches leadership differently. When he has an idea for the main design, he brings it to the team for discussion. We take time to consider all thoughts and considerations together. He's genuinely open to feedback and willing to admit when someone else has an idea he really likes. His collaborative approach to design decisions makes him an exceptional team lead.",
      project: "Senior Capstone Project",
      highlight: "His collaborative approach to design decisions makes him an exceptional team lead."
    }
  ]

  // Use carousel if multiple testimonials, otherwise show single testimonial
  if (testimonials.length > 1) {
    return <TestimonialCarousel testimonials={testimonials} />
  }

  // Single testimonial display
  const testimonial = testimonials[0]
  
  return (
    <div className="mb-16">
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">What People Say</h2>
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          role="article"
          aria-label={`Testimonial from ${testimonial.name}`}
        >
          <div className="mb-6">
            <div className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              &ldquo;{testimonial.highlight}&rdquo;
            </div>
            <blockquote className="text-gray-700 dark:text-gray-300 text-base md:text-lg leading-relaxed italic">
              &ldquo;{testimonial.content}&rdquo;
            </blockquote>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {testimonial.name}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {testimonial.title}
              </div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">
                {testimonial.company}
              </div>
            </div>
            
            <div className="text-left sm:text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Project: {testimonial.project}
              </div>
              {testimonial.articleLink && (
                <a
                  href={testimonial.articleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-md px-1 py-1"
                  aria-label={`Read full article about ${testimonial.project} project on BikeIndex.org`}
                >
                  Read Full Article
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}