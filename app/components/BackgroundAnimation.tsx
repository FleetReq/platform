export default function BackgroundAnimation() {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-100/70 to-indigo-100 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 transition-colors duration-300"></div>
      
      {/* Floating geometric elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large floating circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-300/40 dark:bg-blue-400/8 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-indigo-300/35 dark:bg-indigo-400/6 rounded-full blur-3xl animate-float-slower"></div>
        <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-purple-300/38 dark:bg-purple-400/8 rounded-full blur-3xl animate-float-reverse"></div>
        
        {/* Medium floating elements */}
        <div className="absolute top-1/4 left-1/5 w-32 h-32 bg-blue-400/45 dark:bg-blue-500/10 rounded-full blur-2xl animate-float-medium"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-indigo-400/50 dark:bg-indigo-500/12 rounded-full blur-xl animate-float-medium-delayed"></div>
        
        {/* Small accent dots */}
        <div className="absolute top-1/6 left-1/4 w-3 h-3 bg-blue-500/20 dark:bg-blue-400/30 rounded-full blur-sm animate-float-dot"></div>
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-indigo-500/25 dark:bg-indigo-400/30 rounded-full blur-sm animate-float-dot-delayed"></div>
        <div className="absolute top-1/2 left-2/3 w-4 h-4 bg-purple-500/18 dark:bg-purple-400/25 rounded-full blur-sm animate-float-dot-slow"></div>
        
        {/* Additional light mode elements */}
        <div className="absolute top-1/3 right-1/6 w-16 h-16 bg-rose-300/45 dark:bg-rose-400/8 rounded-full blur-xl animate-float-dot opacity-100 dark:opacity-70"></div>
        <div className="absolute bottom-1/4 left-1/6 w-20 h-20 bg-cyan-300/40 dark:bg-cyan-400/8 rounded-full blur-2xl animate-float-medium-delayed opacity-100 dark:opacity-70"></div>
        
        {/* Enhanced grid pattern */}
        <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05]" 
             style={{
               backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.25) 1px, transparent 1px)',
               backgroundSize: '40px 40px',
               animation: 'grid-drift 60s ease-in-out infinite'
             }}>
        </div>
      </div>
      
      {/* Content overlay for better text readability */}
      <div className="absolute inset-0 bg-white/10 dark:bg-gray-900/10 backdrop-blur-[0.5px]"></div>
    </div>
  )
}