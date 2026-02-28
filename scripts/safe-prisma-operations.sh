#!/bin/bash

# Safe Prisma Operations Workflow
# Prevents migration drift and ensures database consistency

set -e  # Exit on any error

echo "🔧 Safe Prisma Operations Starting..."

# Function to check if database exists and is accessible
check_database() {
    echo "🔍 Checking database connection..."
    if npx prisma db pull --force 2>/dev/null; then
        echo "✅ Database accessible"
        return 0
    else
        echo "❌ Database not accessible"
        return 1
    fi
}

# Function to validate schema before operations
validate_schema() {
    echo "📋 Validating Prisma schema..."
    if npx prisma validate; then
        echo "✅ Schema validation passed"
        return 0
    else
        echo "❌ Schema validation failed"
        return 1
    fi
}

# Function to safely generate client
generate_client() {
    echo "🏗️ Generating Prisma client..."
    rm -rf node_modules/.prisma
    if npx prisma generate; then
        echo "✅ Client generated successfully"
        return 0
    else
        echo "❌ Client generation failed"
        return 1
    fi
}

# Function to check migration status
check_migration_status() {
    echo "📊 Checking migration status..."
    npx prisma migrate status
}

# Function to safely apply schema changes
safe_schema_apply() {
    local operation=$1
    echo "🔄 Applying schema operation: $operation"
    
    case $operation in
        "push")
            echo "Using prisma db push (safer for development)..."
            npx prisma db push
            ;;
        "migrate")
            echo "Using prisma migrate (for production)..."
            npx prisma migrate dev --name "$2"
            ;;
        *)
            echo "❌ Unknown operation: $operation"
            return 1
            ;;
    esac
}

# Function to seed data safely
safe_seed() {
    echo "🌱 Seeding data safely..."
    
    # Check if factor library needs seeding
    if npm run seed:factor-library 2>/dev/null; then
        echo "✅ Factor library already seeded"
    else
        echo "🌱 Running factor library seeding..."
        npm run seed:factor-library
    fi
}

# Main workflow
main() {
    local command=$1
    
    case $command in
        "validate")
            check_database || exit 1
            validate_schema || exit 1
            generate_client || exit 1
            echo "✅ All validations passed"
            ;;
        "sync")
            check_database || exit 1
            validate_schema || exit 1
            safe_schema_apply "push" || exit 1
            generate_client || exit 1
            safe_seed || exit 1
            echo "✅ Database sync completed"
            ;;
        "status")
            check_database
            validate_schema
            check_migration_status
            ;;
        "reset-safe")
            echo "⚠️  SAFE RESET - This will preserve data structure"
            read -p "Are you sure you want to safe reset? (y/N): " confirm
            if [[ $confirm == [yY] ]]; then
                check_database || exit 1
                safe_schema_apply "push" || exit 1
                generate_client || exit 1
                safe_seed || exit 1
                echo "✅ Safe reset completed"
            else
                echo "❌ Safe reset cancelled"
            fi
            ;;
        "help"|"-h"|"--help")
            echo "Safe Prisma Operations"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  validate    - Validate database connection and schema"
            echo "  sync        - Sync database with schema and seed data"
            echo "  status      - Check database and migration status"
            echo "  reset-safe  - Safe reset (preserves structure, reseeds data)"
            echo "  help        - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 validate     # Validate everything before making changes"
            echo "  $0 sync         # Sync database safely"
            echo "  $0 reset-safe   # Safe reset when needed"
            ;;
        *)
            echo "❌ Unknown command: $command"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
