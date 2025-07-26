// Mock API endpoints for testing the caching system
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', avatar: 'https://i.pravatar.cc/150?img=4' },
  { id: 5, name: 'David Brown', email: 'david@example.com', avatar: 'https://i.pravatar.cc/150?img=5' }
]

const posts = [
  { id: 1, userId: 1, title: 'Welcome to Our Platform', content: 'This is our first post!', createdAt: '2024-01-15' },
  { id: 2, userId: 2, title: 'Getting Started Guide', content: 'Here\'s how to get started...', createdAt: '2024-01-16' },
  { id: 3, userId: 1, title: 'API Caching Benefits', content: 'Caching improves performance significantly...', createdAt: '2024-01-17' },
  { id: 4, userId: 3, title: 'Modern Web Development', content: 'The web development landscape...', createdAt: '2024-01-18' },
  { id: 5, userId: 4, title: 'TypeScript Best Practices', content: 'Here are some TypeScript tips...', createdAt: '2024-01-19' }
]

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default defineEventHandler(async (event) => {
  const url = getRouterParam(event, 'path')
  const method = getMethod(event)
  const query = getQuery(event)
  
  // Add realistic delay
  await delay(Math.random() * 1000 + 500) // 500-1500ms delay
  
  console.log(`Mock API: ${method} /api/${url}`)
  
  try {
    switch (url) {
      case 'users':
        if (method === 'GET') {
          const page = parseInt(query.page as string) || 1
          const limit = parseInt(query.limit as string) || 10
          const start = (page - 1) * limit
          const end = start + limit
          
          return {
            data: users.slice(start, end),
            pagination: {
              page,
              limit,
              total: users.length,
              totalPages: Math.ceil(users.length / limit)
            }
          }
        }
        break
        
      case 'posts':
        if (method === 'GET') {
          const userId = query.userId ? parseInt(query.userId as string) : null
          const filteredPosts = userId ? posts.filter(p => p.userId === userId) : posts
          
          return {
            data: filteredPosts.map(post => ({
              ...post,
              author: users.find(u => u.id === post.userId)
            }))
          }
        }
        break
        
      case 'stats':
        if (method === 'GET') {
          return {
            users: users.length,
            posts: posts.length,
            lastUpdated: new Date().toISOString(),
            serverTime: new Date().toISOString()
          }
        }
        break
        
      case 'slow-endpoint':
        if (method === 'GET') {
          // Simulate a very slow endpoint
          await delay(3000)
          return {
            message: 'This endpoint is intentionally slow to demonstrate caching benefits',
            timestamp: new Date().toISOString(),
            randomData: Math.random()
          }
        }
        break
        
      default:
        throw createError({
          statusCode: 404,
          statusMessage: `Endpoint not found: /api/${url}`
        })
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})
