const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
require('dotenv').config();
const supabase = require('./lib/db');

const app  = express();
const PORT = process.env.PORT || 3000;
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', async (req, res) => {
  const { count, error } = await supabase.from('users')
  .select('*', { count: 'exact', head: true });
  res.json ({ status: 'ok',
    app: 'FlyBy API',
    db: error ? 'disconnected' : 'connected',
    users: count ?? 0,
    timestamp: new Date().toISOString(),
  })
});

// route stubs
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/trips',     require('./routes/trips'));
app.use('/api/convoy',    require('./routes/convoy'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.listen(PORT, () => {
  console.log(`FlyBy API running on port ${PORT}`);
});