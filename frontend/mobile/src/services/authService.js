const API_URL = 'http://10.0.2.2:3000';

export async function login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { throw new Error (data.error || 'Login failed'); }
    return data;
}

export async function register(email, username, password) {
    const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
    });
    const data = await res.json();
    if (!res.ok) { throw new Error (data.error || 'Registration failed'); }
    return data;
}