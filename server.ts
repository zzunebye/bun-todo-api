import type { Todo } from "./type";

const fakeTodo: Todo = {
    id: 1,
    title: "Sample Todo",
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

type AddTodoRequest = {
    title: string,
}

type UpdateTodoRequest = {
    title: string,
    completed: boolean,
}
const todos: Todo[] = [];

const server = Bun.serve({
    port: 3000,
    // this is the function that will be called when a request is made to the server
    fetch(req) {
        return new Response("Hello from Bun")
    },
    routes: {
        "/": () => new Response("Welcome to the Bun demo Todo API!"),
        "/health": () => Response.json({ "status": "ok" }),
        "/todos": {
            GET: () => Response.json(todos),
            POST: async req => {
                // Parse the JSON body more safely and add a type assertion
                const body = await req.json() as AddTodoRequest;

                if (typeof body !== "object" || body === null) {
                    return Response.json({ error: "Invalid request body" }, { status: 400 });
                }

                if (!body.title) {
                    return Response.json({ error: "Title is required" }, { status: 400 });
                }

                const newTodo: Todo = {
                    id: todos.length + 1,
                    title: body.title,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                todos.push(newTodo);
                return Response.json(newTodo, { status: 201 })
            },
        },
        "/todos/:id": {
            GET: (req) => {
                console.log(req.params.id)
                const todo = todos.find(todo => todo.id === parseInt(req.params.id));
                if (!todo) {
                    return Response.json({ error: "Todo not found" }, { status: 404 });
                }
                return Response.json(todo);
            },
            PATCH: async (req) => {
                const body = await req.json() as UpdateTodoRequest;
                const todo = todos.find(todo => todo.id === parseInt(req.params.id));
                if (!todo) {
                    return Response.json({ error: "Todo not found" }, { status: 404 });
                }
                todo.title = body.title;
                todo.completed = body.completed;
                todo.updatedAt = new Date().toISOString();
                return Response.json(todo);
            },
            DELETE: (req) => {
                const todo = todos.find(todo => todo.id === parseInt(req.params.id));
                if (!todo) {
                    return Response.json({ error: "Todo not found" }, { status: 404 });
                }
                todos.splice(todos.indexOf(todo), 1);
                return Response.json(null, { status: 204 });
            }
        },
        "/login": () => new Response("Login page"),
        "/register": () => new Response("Register page"),
    }
});

console.log(`Server is runnin on http://localhost:${server.port}`)