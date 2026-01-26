#!/bin/bash

# Database Setup Script for Khanflow
# This script helps you set up the PostgreSQL database

echo "🚀 Khanflow Database Setup"
echo "=========================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL: https://www.postgresql.org/download/"
    exit 1
fi

echo "✅ PostgreSQL is installed"
echo ""

# Get database credentials
read -p "Enter PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Enter PostgreSQL password: " DB_PASSWORD
echo ""

read -p "Enter PostgreSQL host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter PostgreSQL port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Enter database name (default: khanflow): " DB_NAME
DB_NAME=${DB_NAME:-khanflow}

echo ""
echo "📝 Database Configuration:"
echo "   User: $DB_USER"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo ""

# Test connection
export PGPASSWORD=$DB_PASSWORD
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "\q" 2>/dev/null; then
    echo "✅ Connection to PostgreSQL successful"
else
    echo "❌ Failed to connect to PostgreSQL"
    echo "Please check your credentials and make sure PostgreSQL is running"
    exit 1
fi

# Check if database exists
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null; then
    echo "⚠️  Database '$DB_NAME' already exists"
    read -p "Do you want to drop and recreate it? (y/N): " RECREATE
    if [[ $RECREATE =~ ^[Yy]$ ]]; then
        echo "🗑️  Dropping database..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
        echo "✅ Database dropped"
    else
        echo "📦 Using existing database"
    fi
fi

# Create database if it doesn't exist
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\q" 2>/dev/null; then
    echo "📦 Creating database '$DB_NAME'..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"
    echo "✅ Database created"
fi

# Update .env file
echo ""
echo "📝 Updating .env file..."
ENV_FILE=".env"
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

if [ -f "$ENV_FILE" ]; then
    # Update DATABASE_URL if it exists, otherwise append it
    if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" "$ENV_FILE"
        else
            # Linux
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" "$ENV_FILE"
        fi
    else
        echo "DATABASE_URL=$DATABASE_URL" >> "$ENV_FILE"
    fi
    echo "✅ .env file updated"
else
    echo "⚠️  .env file not found. Please create it and add:"
    echo "   DATABASE_URL=$DATABASE_URL"
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Run migrations: npm run db:migrate"
echo "2. Start the server: npm run dev"
