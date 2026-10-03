export type Todo = {
    id: number,
    title: string,
    completed: boolean,
    createdAt: string,
    updatedAt: string,
}

// If we used Interface instead of a Type
// interface Todo {
//     id: number,
//     title: string,
//     completed: boolean,
//     createdAt: string,
//     updatedAt: string,
// }

export type AddTodoRequest = {
    title: string,
}

export type UpdateTodoRequest = {
    title: string,
    completed: boolean,
}
