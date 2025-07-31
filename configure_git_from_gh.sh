#!/bin/bash

# Automatically configure Git with information from the GitHub CLI.

echo "Attempting to configure Git with information from GitHub..."

# Get username
git_user_name=$(gh api user --jq .name)
if [ -z "$git_user_name" ] || [ "$git_user_name" == "null" ]; then
    echo "Error: Could not retrieve username from GitHub."
    exit 1
fi

# Get public email
git_user_email=$(gh api user --jq .email)

# If email is private/null, create a noreply email address
if [ -z "$git_user_email" ] || [ "$git_user_email" == "null" ]; then
    echo "Public email not found. Creating a GitHub noreply email."
    user_id=$(gh api user --jq .id)
    user_login=$(gh api user --jq .login)
    
    if [ -z "$user_id" ] || [ "$user_id" == "null" ] || [ -z "$user_login" ] || [ "$user_login" == "null" ]; then
        echo "Error: Could not retrieve user ID or login to create a noreply email."
        exit 1
    fi
    
    git_user_email="${user_id}+${user_login}@users.noreply.github.com"
    echo "Noreply email created: $git_user_email"
fi

# Set global Git config
git config --global user.name "$git_user_name"
git config --global user.email "$git_user_email"

echo ""
echo "Git configuration updated successfully!"
echo "Here is your current user configuration:"
git config --list | grep user
