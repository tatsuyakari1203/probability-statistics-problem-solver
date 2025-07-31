#!/bin/bash

# Tự động định cấu hình Git bằng thông tin từ GitHub CLI.

echo "Đang cố gắng định cấu hình Git bằng thông tin từ GitHub..."

# Lấy tên người dùng
git_user_name=$(gh api user --jq .name)
if [ -z "$git_user_name" ] || [ "$git_user_name" == "null" ]; then
    echo "Lỗi: Không thể lấy tên người dùng từ GitHub."
    exit 1
fi

# Lấy email công khai
git_user_email=$(gh api user --jq .email)

# Nếu email là riêng tư/null, hãy tạo địa chỉ email noreply
if [ -z "$git_user_email" ] || [ "$git_user_email" == "null" ]; then
    echo "Email công khai không được tìm thấy. Đang tạo email noreply của GitHub."
    user_id=$(gh api user --jq .id)
    user_login=$(gh api user --jq .login)
    
    if [ -z "$user_id" ] || [ "$user_id" == "null" ] || [ -z "$user_login" ] || [ "$user_login" == "null" ]; then
        echo "Lỗi: Không thể lấy ID người dùng hoặc tên đăng nhập để tạo email noreply."
        exit 1
    fi
    
    git_user_email="${user_id}+${user_login}@users.noreply.github.com"
    echo "Đã tạo email Noreply: $git_user_email"
fi

# Đặt cấu hình Git toàn cục
git config --global user.name "$git_user_name"
git config --global user.email "$git_user_email"

echo ""
echo "Cấu hình Git đã được cập nhật thành công!"
echo "Đây là cấu hình người dùng hiện tại của bạn:"
git config --list | grep user
