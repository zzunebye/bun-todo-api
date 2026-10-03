import { store } from "./db";
import type { AddTodoRequest, UpdateTodoRequest } from "./type";

const server = Bun.serve({
    port: 3000,
    // this is the function that will be called when a request is made to the server but no route found
    fetch(req) {
        return new Response("Route Not Found in this API")
    },
    routes: {
        "/": () => new Response("Welcome to the Bun demo Todo API!"),
        "/health": () => Response.json({ "status": "ok" }),
        "/todos": {
            GET: (req) => {
                const url = new URL(req.url);
                const page = url.searchParams.get('page');
                const limit = url.searchParams.get('limit');
                const completed = url.searchParams.get('completed');
                const search = url.searchParams.get('search');
                console.log(page, limit, completed, search);
                return Response.json(store.list({
                    completed: completed === null ? undefined : completed === "true",
                    search: search && search.length > 0 ? search : undefined,
                }))
            },
            POST: async req => {
                // Parse the JSON body more safely and add a type assertion
                const body = await req.json() as AddTodoRequest;

                if (typeof body !== "object" || body === null) {
                    return Response.json({ error: "Invalid request body" }, { status: 400 });
                }

                if (!body.title) {
                    return Response.json({ error: "Title is required" }, { status: 400 });
                }

                return Response.json(store.add(body.title), { status: 201 })
            },
        },
        "/todos/:id": {
            GET: (req) => {
                const todo = store.get(parseInt(req.params.id));
                if (!todo) {
                    return Response.json({ error: "Todo not found" }, { status: 404 });
                }
                return Response.json(todo);
            },
            PATCH: async (req) => {
                const body = await req.json() as UpdateTodoRequest;
                const todo = store.update(parseInt(req.params.id), body);
                if (!todo) {
                    return Response.json({ error: "Todo not found" }, { status: 404 });
                }
                return Response.json(todo);
            },
            DELETE: (req) => {
                const removed = store.remove(parseInt(req.params.id));
                if (!removed) {
                    return Response.json({ error: "Todo not found" }, { status: 404 });
                }
                return Response.json(null, { status: 204 });
            }
        },
        "/login": () => new Response("Login page"),
        "/register": () => new Response("Register page"),
    }
});

console.log(`Server is runnin on http://localhost:${server.port}`)
