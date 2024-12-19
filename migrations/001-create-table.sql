-- Create the users table with a 'pass' column for password storage
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  pass TEXT NOT NULL
);