-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  estimated_cooking_time INTEGER NOT NULL DEFAULT 0,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  source JSONB NOT NULL DEFAULT '{}'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  selected_for_week TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weeks table
CREATE TABLE IF NOT EXISTS weeks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  selected_meals JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS meals_user_id_idx ON meals(user_id);
CREATE INDEX IF NOT EXISTS meals_selected_for_week_idx ON meals(selected_for_week);
CREATE INDEX IF NOT EXISTS weeks_user_id_idx ON weeks(user_id);

-- Enable Row Level Security
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meals
CREATE POLICY "Users can view their own meals"
  ON meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON meals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON meals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for weeks
CREATE POLICY "Users can view their own weeks"
  ON weeks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weeks"
  ON weeks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weeks"
  ON weeks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weeks"
  ON weeks FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weeks_updated_at BEFORE UPDATE ON weeks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create meal_candidates table
CREATE TABLE IF NOT EXISTS meal_candidates (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, meal_id)
);

-- Create indexes for meal_candidates
CREATE INDEX IF NOT EXISTS meal_candidates_user_id_idx ON meal_candidates(user_id);
CREATE INDEX IF NOT EXISTS meal_candidates_meal_id_idx ON meal_candidates(meal_id);

-- Enable Row Level Security for meal_candidates
ALTER TABLE meal_candidates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal_candidates
CREATE POLICY "Users can view their own meal candidates"
  ON meal_candidates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal candidates"
  ON meal_candidates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal candidates"
  ON meal_candidates FOR DELETE
  USING (auth.uid() = user_id);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)  -- Prevent duplicate category names per user
);

-- Create index for categories
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);

-- Enable Row Level Security for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);