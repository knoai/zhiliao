#!/bin/bash

# 知了云文档本地启动脚本（使用本地 PostgreSQL）

echo "🚀 启动知了云文档（本地开发模式）..."
echo ""
echo "📡 数据库连接: localhost:5432/cloud_notes"
echo ""

# 检查虚拟环境
if [ ! -d "backend/venv" ]; then
    echo "📦 创建 Python 虚拟环境..."
    cd backend && python3 -m venv venv && cd ..
fi

# 激活虚拟环境并安装依赖
echo "📦 安装后端依赖..."
cd backend
source venv/bin/activate
pip install -q -r requirements.txt

# 启动后端（后台运行）
echo "🟢 启动后端服务..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# 安装前端依赖并启动
echo "🟢 启动前端服务..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 服务已启动！"
echo ""
echo "📱 访问地址："
echo "   前端界面: http://localhost:5173"
echo "   API 文档: http://localhost:8000/docs"
echo "   API 地址: http://localhost:8000"
echo ""
echo "📝 常用命令："
echo "   停止后端: kill $BACKEND_PID"
echo "   停止前端: kill $FRONTEND_PID"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
