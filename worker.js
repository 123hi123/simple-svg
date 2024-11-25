// Define KV namespace binding in your Cloudflare Worker configuration
// KV_NAMESPACE

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  let path = url.pathname === '/' ? '/index.html' : url.pathname

  try {
    // Fetch the file content from KV
    let content = await KV_NAMESPACE.get(path, 'arrayBuffer')

    if (content === null) {
      return new Response('File not found', { status: 404 })
    }

    // Determine content type
    const extname = path.split('.').pop().toLowerCase()
    let contentType = 'text/html'
    
    switch (extname) {
      case 'js':
        contentType = 'text/javascript'
        break
      case 'css':
        contentType = 'text/css'
        break
      case 'json':
        contentType = 'application/json'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'svg':
        contentType = 'image/svg+xml'
        break
    }

    // Return the response with appropriate headers
    return new Response(content, {
      status: 200,
      headers: { 'Content-Type': contentType }
    })
  } catch (error) {
    return new Response(`Server error: ${error.message}`, { status: 500 })
  }
}

// Helper function to upload files to KV (to be run separately)
async function uploadFilesToKV() {
  const files = [
    { path: '/index.html', content: '<!-- Your index.html content -->' },
    // Add other files here
  ]

  for (const file of files) {
    await KV_NAMESPACE.put(file.path, file.content)
  }
}
