import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  FileText, 
  ChevronRight, 
  Sparkles,
  Layout,
  Users,
  Zap,
  ArrowRight,
  Globe,
  Compass
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                知了云笔记
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/public/books')}
                className="hidden sm:flex items-center gap-1.5 text-slate-600 hover:text-amber-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                公开书籍
              </button>
              <button
                onClick={() => navigate('/public/docs')}
                className="hidden sm:flex items-center gap-1.5 text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                公开文档
              </button>
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/workspace')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  进入工作台
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-slate-600 hover:text-slate-900 px-4 py-2"
                  >
                    登录
                  </Link>
                  <Link 
                    to="/login" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    免费使用
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            全新升级 · 云书籍 + 云文档双模式
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            用结构化思维
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              构建你的知识体系
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            知了云笔记提供云书籍和云文档两种创作模式。
            无论是系统化的知识库还是灵活的笔记，都能轻松驾驭。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/workspace')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-lg font-medium shadow-lg shadow-blue-200"
              >
                进入工作台
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-lg font-medium shadow-lg shadow-blue-200"
                >
                  免费开始使用
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl hover:border-slate-300 transition-all text-lg font-medium"
                >
                  了解更多
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              两种创作模式，满足多样需求
            </h2>
            <p className="text-lg text-slate-600">
              根据内容特点选择最适合的组织方式
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 云书籍 */}
            <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100 hover:shadow-xl transition-all">
              <div className="absolute top-6 right-6 w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">云书籍</h3>
              <p className="text-slate-600 mb-6">
                类似 GitBook/语雀知识库的结构化书籍。适合系统化内容，
                支持无限层级章节，构建完整的知识体系。
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-amber-600" />
                  </div>
                  树形章节结构，层级清晰
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-amber-600" />
                  </div>
                  自动生成大纲和目录
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-amber-600" />
                  </div>
                  支持导出为电子书格式
                </li>
              </ul>
              {isAuthenticated && (
                <button
                  onClick={() => navigate('/books')}
                  className="w-full py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium"
                >
                  创建云书籍
                </button>
              )}
            </div>

            {/* 云文档 */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:shadow-xl transition-all">
              <div className="absolute top-6 right-6 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">云文档</h3>
              <p className="text-slate-600 mb-6">
                灵活的独立文档，支持文件夹分类管理。适合快速记录、
                团队协作、临时文档等多种场景。
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-blue-600" />
                  </div>
                  所见即所得编辑器
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-blue-600" />
                  </div>
                  Markdown 粘贴自动转换
                </li>
                <li className="flex items-center gap-3 text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-blue-600" />
                  </div>
                  版本历史与自动保存
                </li>
              </ul>
              {isAuthenticated && (
                <button
                  onClick={() => navigate('/docs')}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  创建云文档
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              强大的编辑能力
            </h2>
            <p className="text-lg text-slate-600">
              让写作更流畅，让知识更有价值
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Layout className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">所见即所得</h4>
              <p className="text-sm text-slate-600">
                Slate.js 驱动的富文本编辑器，实时预览，专注写作
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Markdown 支持</h4>
              <p className="text-sm text-slate-600">
                支持 Markdown 快捷输入，粘贴自动转换格式
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-rose-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">云端同步</h4>
              <p className="text-sm text-slate-600">
                自动保存，多端同步，随时随地访问你的知识库
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-cyan-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">知识管理</h4>
              <p className="text-sm text-slate-600">
                标签、文件夹、全文搜索，高效组织海量内容
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Content Section */}
      <section className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              探索公开内容
            </h2>
            <p className="text-lg text-slate-600">
              无需登录，浏览社区分享的优质书籍和文档
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <button
              onClick={() => navigate('/public/books')}
              className="group flex items-center gap-5 p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl hover:shadow-lg transition-all text-left"
            >
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">公开书籍</h3>
                <p className="text-sm text-slate-600">浏览社区分享的优质知识库和结构化书籍</p>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-400 ml-auto group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/public/docs')}
              className="group flex items-center gap-5 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl hover:shadow-lg transition-all text-left"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">公开文档</h3>
                <p className="text-sm text-slate-600">发现和阅读社区分享的精彩文章和笔记</p>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-400 ml-auto group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            开始构建你的知识体系
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            立即注册，免费使用所有功能。让知识管理变得简单高效。
          </p>
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/workspace')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg shadow-blue-200"
            >
              进入工作台
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg shadow-blue-200"
            >
              免费开始使用
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                知了云笔记
              </span>
            </div>
            <div className="text-sm">
              © 2025 知了云笔记. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
