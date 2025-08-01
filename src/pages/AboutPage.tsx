// import React from 'react'
import { Lightbulb, Heart, Code, Users, Github, Mail } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
      {/* 项目介绍 */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-strong mb-6">
          <Lightbulb className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          关于 <span className="gradient-text">ZhugeExtract</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          一个基于诸葛亮智慧的在线解压工具，专注于隐私保护和用户体验
        </p>
      </div>

      {/* 命名寓意 */}
      <section className="card">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            为什么叫 ZhugeExtract？
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              诸葛亮以其卓越的智慧和深谋远虑闻名于世，我们希望 ZhugeExtract 也能体现这种智慧：
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 mt-4">
              <li><strong>智慧的技术选择</strong> - 使用 WebAssembly 在客户端处理文件，保护用户隐私</li>
              <li><strong>深谋远虑的架构</strong> - 无服务器架构，零成本运营，可持续发展</li>
              <li><strong>用户至上的理念</strong> - 简洁易用的界面，支持多种格式和平台</li>
              <li><strong>开源共享的精神</strong> - 代码完全开源，接受社区贡献和监督</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 技术特性 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
          技术特性
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TechFeature
            title="完全本地处理"
            description="基于 WebAssembly 和 libarchive.js，所有文件处理都在浏览器本地完成，绝不上传到服务器"
            highlight="隐私保护"
          />
          <TechFeature
            title="多格式支持"
            description="支持 ZIP、RAR、7Z、TAR、GZ、BZ2 等主流压缩格式，满足各种使用场景"
            highlight="格式丰富"
          />
          <TechFeature
            title="高性能处理"
            description="利用 WebAssembly 的高性能特性，提供接近原生应用的解压缩速度"
            highlight="性能优异"
          />
          <TechFeature
            title="跨平台兼容"
            description="支持桌面和移动设备，兼容主流浏览器，还提供 PWA 和小程序版本"
            highlight="兼容性强"
          />
        </div>
      </section>

      {/* 开发理念 */}
      <section className="card">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            开发理念
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl mb-4 text-red-600 dark:text-red-400">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                用户至上
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                始终把用户的隐私和体验放在第一位
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4 text-blue-600 dark:text-blue-400">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                技术驱动
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                采用最新的 Web 技术，提供最佳性能
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl mb-4 text-green-600 dark:text-green-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                开源共享
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                拥抱开源社区，接受贡献和监督
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 技术栈 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
          技术栈
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            'React', 'TypeScript', 'Tailwind CSS', 'Vite',
            'WebAssembly', 'libarchive.js', 'Zustand', 'React Router',
            'Vitest', 'Playwright', 'ESLint', 'Prettier'
          ].map((tech) => (
            <div
              key={tech}
              className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {tech}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 联系我们 */}
      <section className="card">
        <div className="card-body text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            联系我们
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            有问题、建议或想要贡献代码？我们很乐意听到您的声音！
          </p>
          <div className="flex justify-center space-x-6">
            <a
              href="https://github.com/zhuge-extract/zhuge-extract"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
            <a
              href="mailto:hello@zhuge-extract.com"
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200"
            >
              <Mail className="w-5 h-5" />
              <span>邮件</span>
            </a>
          </div>
        </div>
      </section>

      {/* 版本信息 */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>ZhugeExtract v0.1.0 - 基于诸葛亮智慧的在线解压工具</p>
      </div>
    </div>
  )
}

interface TechFeatureProps {
  title: string
  description: string
  highlight: string
}

function TechFeature({ title, description, highlight }: TechFeatureProps) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                {highlight}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}