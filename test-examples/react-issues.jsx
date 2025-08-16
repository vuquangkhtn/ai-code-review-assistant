// Test file with React-specific issues
import React, { useState, useEffect } from 'react';

// React Issue 1: Missing key prop in list rendering
function UserList({ users }) {
    return (
        <ul>
            {users.map(user => (
                <li>{user.name}</li> // Missing key prop
            ))}
        </ul>
    );
}

// React Issue 2: Incorrect dependency array in useEffect
function UserProfile({ userId }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        setLoading(true);
        fetchUser(userId).then(userData => {
            setUser(userData);
            setLoading(false);
        });
    }, []); // Missing userId dependency
    
    return loading ? <div>Loading...</div> : <div>{user?.name}</div>;
}

// React Issue 3: Direct state mutation
function TodoList() {
    const [todos, setTodos] = useState([]);
    
    const addTodo = (text) => {
        todos.push({ id: Date.now(), text, completed: false }); // Direct mutation
        setTodos(todos); // Won't trigger re-render
    };
    
    const toggleTodo = (id) => {
        const todo = todos.find(t => t.id === id);
        todo.completed = !todo.completed; // Direct mutation
        setTodos(todos);
    };
    
    return (
        <div>
            {todos.map(todo => (
                <div key={todo.id} onClick={() => toggleTodo(todo.id)}>
                    {todo.text}
                </div>
            ))}
        </div>
    );
}

// React Issue 4: Inline object creation causing unnecessary re-renders
function ExpensiveComponent({ data }) {
    return (
        <div>
            {data.map(item => (
                <ChildComponent 
                    key={item.id}
                    item={item}
                    style={{ color: 'red', fontSize: '14px' }} // Inline object
                    onClick={() => console.log(item.id)} // Inline function
                />
            ))}
        </div>
    );
}

// React Issue 5: Missing cleanup in useEffect
function Timer() {
    const [time, setTime] = useState(0);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setTime(prev => prev + 1);
        }, 1000);
        // Missing cleanup function
    }, []);
    
    return <div>Time: {time}</div>;
}

// React Issue 6: Incorrect conditional rendering
function ConditionalComponent({ user, posts }) {
    return (
        <div>
            {user && <h1>Welcome {user.name}</h1>}
            {posts.length && ( // Will render 0 if posts is empty
                <div>
                    <h2>Posts</h2>
                    {posts.map(post => <div key={post.id}>{post.title}</div>)}
                </div>
            )}
        </div>
    );
}

// React Issue 7: Using index as key
function DynamicList({ items }) {
    const [list, setList] = useState(items);
    
    const removeItem = (index) => {
        setList(list.filter((_, i) => i !== index));
    };
    
    return (
        <ul>
            {list.map((item, index) => (
                <li key={index}> // Using index as key is problematic
                    {item.name}
                    <button onClick={() => removeItem(index)}>Remove</button>
                </li>
            ))}
        </ul>
    );
}

// React Issue 8: Not handling async operations properly
function AsyncComponent({ id }) {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        fetchData(id).then(result => {
            setData(result); // No check if component is still mounted
        });
    }, [id]);
    
    return <div>{data ? data.name : 'Loading...'}</div>;
}

// Mock functions for demonstration
const fetchUser = async (id) => ({ id, name: `User ${id}` });
const fetchData = async (id) => ({ id, name: `Data ${id}` });
const ChildComponent = ({ item, style, onClick }) => (
    <div style={style} onClick={onClick}>{item.name}</div>
);

export {
    UserList,
    UserProfile,
    TodoList,
    ExpensiveComponent,
    Timer,
    ConditionalComponent,
    DynamicList,
    AsyncComponent
};