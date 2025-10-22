import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/database';
import { LoginRequest, RegisterRequest, UserWithoutPassword } from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { config } from '../config';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Login
router.post('/login', async (req: express.Request<{}, {}, LoginRequest>, res) => {
    console.log('got login: ', req.body);
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ error: 'Username and password required' });
            return;
        }

        db.get(
            'SELECT * FROM users WHERE username = ?',
            [username],
            async (err, user: any) => {
                if (err) {
                    res.status(500).json({ error: 'Database error' });
                    return;
                }

                if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                    res.status(401).json({ error: 'Invalid username or password' });
                    return;
                }
                console.log('found');
                // Fixed JWT sign call
                console.log('confi: ', config.jwt.secret);
                const token = jwt.sign(
                    {
                        id: user.id,
                        username: user.username
                    },
                    config.jwt.secret,
                    {
                        expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn']
                    }
                );
                console.log('made token');

                const userWithoutPassword: UserWithoutPassword = {
                    id: user.id,
                    username: user.username,
                    admin: user.admin,
                    created_at: user.created_at
                };
                console.log('responding');
                res.json({
                    token,
                    user: userWithoutPassword
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Register - Also fixed the SQL query (had too many placeholders)
router.post('/register', async (req: express.Request<{}, {}, RegisterRequest>, res) => {
    console.log('got register: ', req.body);
    try {
        const { username, password, auth } = req.body;

        if (!username || !password || !auth) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }

        // Check authorization code (you can modify this logic)
        if (auth !== process.env.AUTH_CODE) {
            res.status(403).json({ error: 'Invalid authorization code' });
            return;
        }

        // Check if username already exists
        db.get(
            'SELECT id FROM users WHERE username = ?',
            [username],
            async (err, existingUser: any) => {
                if (err) {
                    res.status(500).json({ error: 'Database error' });
                    return;
                }

                if (existingUser) {
                    res.status(400).json({ error: 'Username already exists' });
                    return;
                }

                // Hash password and create user
                const passwordHash = await bcrypt.hash(password, 12);

                // Fixed SQL query - removed extra placeholder
                db.run(
                    'INSERT INTO users (username, password_hash, admin) VALUES (?, ?, ?)',
                    [username, passwordHash, false],
                    function (err) {
                        if (err) {
                            res.status(500).json({ error: 'Failed to create user' });
                            return;
                        }

                        res.status(200).json({ message: 'User registered successfully' });
                    }
                );
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout (client-side token removal - this is just a placeholder)
router.post('/logout', authenticateToken, (req: AuthRequest, res) => {
    console.log('got logout', req.body);
    // In a real app, you might want to maintain a blacklist of tokens
    // For now, we just confirm the logout request
    res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
    console.log('get me: ', req.body);
    res.json({ user: req.user });
});

// all users

interface SafeUser {
  id: number;
  username: string;
  admin: boolean;
  test_account: boolean;
  created_at: string;
}

router.get('/', (req, res) => {
    db.all(
        'SELECT id, username, admin, test_account, created_at FROM users',
        [],
        (err, users: SafeUser[]) => {
            if (err) {
                console.error('Database error:', err);
                res.status(500).json({ error: 'Database error' });
                return;
            }

            res.json({
                users
            });
        }
    );
});

// Delete user by username
router.delete('/:username', /*authenticateToken,*/ (req: AuthRequest, res) => {
    const { username } = req.params;

    // Optional: Prevent users from deleting themselves or add admin check
    if (req.user?.username === username) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
    }

    // Optional: Only allow admins to delete users

    if (!req.user?.admin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    /*
    db.run(
        'DELETE FROM users WHERE username = ?',
        [username],
        function(err) {
            if (err) {
                res.status(500).json({ error: 'Database error' });
                return;
            }

            if (this.changes === 0) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({ message: `User ${username} deleted successfully` });
        }
    );
    */
});

// Delete user by ID
router.delete('/id/:id', /*authenticateToken,*/ (req: AuthRequest, res) => {
    const { id } = req.params;

    // Optional: Prevent users from deleting themselves
    if (req.user?.id === parseInt(id)) {
        res.status(400).json({ error: 'Cannot delete your own account' });
        return;
    }

    // Optional: Only allow admins to delete users

    if (!req.user?.admin) {
        res.status(403).json({ error: 'Admin access required' });
        return;
    }
    /*
    db.run(
        'DELETE FROM users WHERE id = ?',
        [id],
        function(err) {
            if (err) {
                res.status(500).json({ error: 'Database error' });
                return;
            }

            if (this.changes === 0) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({ message: `User with ID ${id} deleted successfully` });
        }
    );
    */
});

export default router;