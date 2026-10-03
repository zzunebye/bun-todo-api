import { Database } from "bun:sqlite";
import type { Todo, UpdateTodoRequest } from "./type";

type StoreMode = "memory" | "sqlite";

type TodoStore = {
    list(query: { completed?: boolean; search?: string }): Todo[];
    get(id: number): Todo | undefined;
    add(title: string): Todo;
    update(id: number, patch: UpdateTodoRequest): Todo | undefined;
    remove(id: number): boolean;
};

type TodoRow = {
    id: number;
    title: string;
    completed: number;
    createdAt: string;
    updatedAt: string;
};

function toTodo(row: TodoRow): Todo {
    return { ...row, completed: Boolean(row.completed) };
}

function readStoreMode(): StoreMode {
    return "memory";
}

function createMemoryStore(): TodoStore {
    const todos: Todo[] = [];
    let nextId = 1;
    return {
        list(query) {
            return todos.filter((todo) => {
                if (query.completed !== undefined && todo.completed !== query.completed) {
                    return false;
                }
                if (query.search && !todo.title.toLowerCase().includes(query.search.toLowerCase())) {
                    return false;
                }
                return true;
            });
        },
        get(id) {
            return todos.find((todo) => todo.id === id);
        },
        add(title) {
            const now = new Date().toISOString();
            const todo: Todo = {
                id: nextId++,
                title,
                completed: false,
                createdAt: now,
                updatedAt: now,
            };
            todos.push(todo);
            return todo;
        },
        update(id, patch) {
            const todo = todos.find((todo) => todo.id === id);
            if (!todo) return undefined;
            todo.title = patch.title;
            todo.completed = patch.completed;
            todo.updatedAt = new Date().toISOString();
            return todo;
        },
        remove(id) {
            const index = todos.findIndex((todo) => todo.id === id);
            if (index === -1) return false;
            todos.splice(index, 1);
            return true;
        },
    };
}

function createSqliteStore(filename: string): TodoStore {
    const db = new Database(filename);
    db.run(`
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            completed INTEGER NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
        )
    `);

    const insertTodo = db.prepare(
        "INSERT INTO todos (title, completed, createdAt, updatedAt) VALUES (?, ?, ?, ?)",
    );
    const selectTodo = db.query("SELECT * FROM todos WHERE id = ?");
    const updateTodoRow = db.prepare(
        "UPDATE todos SET title = ?, completed = ?, updatedAt = ? WHERE id = ?",
    );
    const deleteTodoRow = db.prepare("DELETE FROM todos WHERE id = ?");

    return {
        list(query) {
            const conditions: string[] = [];
            const params: Array<string | number> = [];

            if (query.completed !== undefined) {
                conditions.push("completed = ?");
                params.push(query.completed ? 1 : 0);
            }
            if (query.search) {
                conditions.push("LOWER(title) LIKE ?");
                params.push(`%${query.search.toLowerCase()}%`);
            }

            const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
            const rows = db.query(`SELECT * FROM todos ${where}`).all(...params) as TodoRow[];
            return rows.map(toTodo);
        },
        get(id) {
            const row = selectTodo.get(id) as TodoRow | null;
            if (!row) return undefined;
            return toTodo(row);
        },
        add(title) {
            const now = new Date().toISOString();
            const result = insertTodo.run(title, 0, now, now);
            return {
                id: Number(result.lastInsertRowid),
                title,
                completed: false,
                createdAt: now,
                updatedAt: now,
            };
        },
        update(id, patch) {
            const updatedAt = new Date().toISOString();
            const result = updateTodoRow.run(patch.title, patch.completed ? 1 : 0, updatedAt, id);
            if (result.changes === 0) return undefined;
            const row = selectTodo.get(id) as TodoRow;
            return toTodo(row);
        },
        remove(id) {
            return deleteTodoRow.run(id).changes > 0;
        },
    };
}

function createStore(mode: StoreMode): TodoStore {
    if (mode === "memory") {
        return createMemoryStore();
    }
    return createSqliteStore("todos.sqlite");
}

export const store = createStore(readStoreMode());
