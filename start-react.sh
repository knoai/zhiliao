#!/bin/bash

# 知了云文档 React 前端启动脚本

echo "🚀 启动知了云文档（React 版本）..."
echo ""
echo "📡 后端 API: http://localhost:8000"
echo ""

# 检查虚拟环境
if [ ! -d "backend/venv" ]; then
    echo "📦 创建 Python 虚拟环境..."
    cd backend && python3 -m venv venv && cd ..
fi

# 启动后端
echo "🟢 启动后端服务..."
cd backend
source venv/bin/activate
pip install -q -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# 启动 React 前端
echo "🟢 启动 React 前端..."
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
echo "   React 前端: http://localhost:5174"
echo "   API 文档:   http://localhost:8000/docs"
echo "   API 地址:   http://localhost:8000"
echo ""
echo "💡 Vue 前端仍然可用: http://localhost:5173"
echo "   （如需启动 Vue 版本，请运行 ./start-local.sh）"
echo ""
echo "📝 按 Ctrl+C 停止所有服务"

# 等待中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
