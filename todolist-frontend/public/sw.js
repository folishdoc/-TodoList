const CACHE_NAME = 'todolist-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
]

// 安装Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// 拦截请求
self.addEventListener('fetch', (event) => {
  // 开发环境不缓存，直接返回网络请求
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    return
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 缓存命中，返回缓存的资源
        if (response) {
          return response
        }
        
        // 否则发起网络请求
        return fetch(event.request).then(
          (response) => {
            // 检查是否是有效的响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }
            
            // 克隆响应
            const responseToCache = response.clone()
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })
            
            return response
          }
        )
      }).catch(() => {
        // 网络错误时返回离线页面
        return new Response('Offline', { status: 503 })
      })
  )
})

// 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
