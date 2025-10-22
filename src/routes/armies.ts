import express from 'express';
import { db } from '../database/database';
import { ArmyList, CreateArmyRequest, UpdateArmyRequest } from '../models/Army';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Initialize armies table
db.run(`
  CREATE TABLE IF NOT EXISTS armies (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    nation TEXT NOT NULL,
    pointsLimit INTEGER NOT NULL,
    units TEXT NOT NULL, -- JSON string
    totalPoints INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`, (err) => {
  if (err) {
    console.error('Error creating armies table:', err);
  } else {
    console.log('Armies table ready');
  }
});

// Get all armies for current user
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  db.all(
    'SELECT * FROM armies WHERE userId = ? ORDER BY createdAt DESC',
    [req.user?.id],
    (err, armies: any[]) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
        return;
      }

      // Parse JSON units
      const parsedArmies = armies.map(army => ({
        ...army,
        units: JSON.parse(army.units)
      }));

      res.json({ armies: parsedArmies });
    }
  );
});

// Get specific army by ID
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;

  db.get(
    'SELECT * FROM armies WHERE id = ? AND userId = ?',
    [id, req.user?.id],
    (err, army: any) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
        return;
      }

      if (!army) {
        res.status(404).json({ error: 'Army not found' });
        return;
      }

      // Parse JSON units
      const parsedArmy = {
        ...army,
        units: JSON.parse(army.units)
      };

      res.json({ army: parsedArmy });
    }
  );
});

// Create new army
router.post('/', authenticateToken, (req: AuthRequest<{}, {}, CreateArmyRequest>, res) => {
  try {
    const { name, nation, pointsLimit, units, totalPoints } = req.body;

    if (!name || !nation || !pointsLimit || !units) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    const armyId = uuidv4();
    const unitsJson = JSON.stringify(units);

    db.run(
      `INSERT INTO armies (id, userId, name, nation, pointsLimit, units, totalPoints) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [armyId, req.user?.id, name, nation, pointsLimit, unitsJson, totalPoints],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Failed to create army' });
          return;
        }

        res.status(201).json({
          message: 'Army created successfully',
          armyId,
          army: {
            id: armyId,
            userId: req.user?.id,
            name,
            nation,
            pointsLimit,
            units,
            totalPoints
          }
        });
      }
    );
  } catch (error) {
    console.error('Create army error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update army
router.put('/:id', authenticateToken, (req: AuthRequest<{ id: string }, {}, UpdateArmyRequest>, res) => {
  try {
    const { id } = req.params;
    const { name, nation, pointsLimit, units, totalPoints } = req.body;

    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (nation !== undefined) {
      updates.push('nation = ?');
      params.push(nation);
    }
    if (pointsLimit !== undefined) {
      updates.push('pointsLimit = ?');
      params.push(pointsLimit);
    }
    if (units !== undefined) {
      updates.push('units = ?');
      params.push(JSON.stringify(units));
    }
    if (totalPoints !== undefined) {
      updates.push('totalPoints = ?');
      params.push(totalPoints);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    params.push(id, req.user?.id);

    db.run(
      `UPDATE armies SET ${updates.join(', ')} WHERE id = ? AND userId = ?`,
      params,
      function(err) {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: 'Failed to update army' });
          return;
        }

        if (this.changes === 0) {
          res.status(404).json({ error: 'Army not found' });
          return;
        }

        res.json({ message: 'Army updated successfully' });
      }
    );
  } catch (error) {
    console.error('Update army error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete army
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM armies WHERE id = ? AND userId = ?',
    [id, req.user?.id],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'Army not found' });
        return;
      }

      res.json({ message: 'Army deleted successfully' });
    }
  );
});

export default router;