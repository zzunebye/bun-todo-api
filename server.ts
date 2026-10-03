const server = Bun.serve({
    port: 3000,
    // this is the function that will be called when a request is made to the server
    fetch(request) {
        return new Response("Hello from Bun")
    },
    routes: {
        "/": () => new Response("Index page"),
        "/about": () => new Response("About page"),
        "/contact": () => new Response("Contact page"),
        "/services": () => new Response("Services page"),
        "/products": () => new Response("Products page"),
        "/blog": () => new Response("Blog page"),
        "/login": () => new Response("Login page"),
        "/register": () => new Response("Register page"),
    }
});

console.log(`Server is runnin on http://localhost:${server.port}`)