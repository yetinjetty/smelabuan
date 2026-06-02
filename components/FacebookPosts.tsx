import { format } from 'date-fns'

interface Post {
  id: string
  message?: string
  full_picture?: string
  permalink_url: string
  created_time: string
}

async function getPosts(): Promise<Post[]> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  if (!token) return []
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/posts?fields=message,full_picture,permalink_url,created_time&limit=2&access_token=${token}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data ?? []) as Post[]
  } catch {
    return []
  }
}

export default async function FacebookPosts() {
  const posts = await getPosts()
  if (!posts.length) return null

  return (
    <div className="space-y-3">
      {posts.map(post => (
        <a
          key={post.id}
          href={post.permalink_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.98] transition-transform duration-150"
        >
          {post.full_picture && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.full_picture}
              alt=""
              className="w-full aspect-video object-cover"
            />
          )}
          <div className="p-4">
            {post.message && (
              <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">
                {post.message}
              </p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-gray-400">
                {format(new Date(post.created_time), 'd MMM yyyy')}
              </span>
              <span className="text-xs font-medium" style={{ color: '#E05A4E' }}>
                View post →
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
