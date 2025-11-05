export default function ShareButton({ text, hashtags = [], url = '', size = 'md' }) {
  const handleShare = () => {
    // Construct Twitter/X share URL
    const baseUrl = 'https://twitter.com/intent/tweet'
    const params = new URLSearchParams()
    
    if (text) params.append('text', text)
    if (hashtags.length > 0) params.append('hashtags', hashtags.join(','))
    if (url) params.append('url', url)
    
    const shareUrl = `${baseUrl}?${params.toString()}`
    
    // Open in new window
    window.open(shareUrl, '_blank', 'width=550,height=420')
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 md:px-4 py-2 text-xs md:text-sm',
    lg: 'px-4 md:px-6 py-3 text-sm md:text-base'
  }

  return (
    <button
      onClick={handleShare}
      className={`${sizeClasses[size]} border-2 border-black bg-white hover:bg-blue-50 transition-colors font-bold inline-flex items-center space-x-1 md:space-x-2`}
      title="Share on X (Twitter)"
    >
      <svg 
        className="w-3 h-3 md:w-4 md:h-4" 
        fill="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      <span>SHARE</span>
    </button>
  )
}
