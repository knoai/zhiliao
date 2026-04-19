#!/bin/bash

# 知了云文档启动脚本

echo "🚀 启动知了云文档..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 启动服务
docker-compose up -d

echo ""
echo "✅ 服务已启动！"
echo ""
echo "📱 访问地址："
echo "   前端界面: http://localhost:5173"
echo "   API 文档: http://localhost:8000/docs"
echo ""
echo "📝 常用命令："
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
