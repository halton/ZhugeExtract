import React from 'react'
import { HelpCircle, FileArchive, Upload, Eye, Download, Lock, AlertTriangle, Smartphone } from 'lucide-react'

export function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* 页面标题 */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-6 text-blue-600 dark:text-blue-400">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          使用帮助
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          快速了解如何使用 ZhugeExtract 解压和预览文件
        </p>
      </div>

      {/* 快速开始 */}
      <section className="card">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            快速开始
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <QuickStartStep
              icon={<Upload className="w-6 h-6" />}
              step="1"
              title="上传文件"
              description="拖拽或点击选择压缩文件"
            />
            <QuickStartStep
              icon={<FileArchive className="w-6 h-6" />}
              step="2"
              title="自动识别"
              description="系统自动识别文件格式"
            />
            <QuickStartStep
              icon={<Eye className="w-6 h-6" />}
              step="3"
              title="浏览预览"
              description="查看文件结构和内容"
            />
            <QuickStartStep
              icon={<Download className="w-6 h-6" />}
              step="4"
              title="下载文件"
              description="选择需要的文件下载"
            />
          </div>
        </div>
      </section>

      {/* 支持的格式 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          支持的格式
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormatCard
            title="ZIP 格式"
            description="最常用的压缩格式，支持密码保护、多种压缩算法"
            features={['密码保护', 'AES加密', '多种压缩级别', '目录结构']}
            support="完全支持"
          />
          <FormatCard
            title="RAR 格式"
            description="高压缩比格式，支持分卷、固实压缩、恢复记录"
            features={['分卷压缩', '固实压缩', '恢复记录', '文件注释']}
            support="完全支持"
          />
          <FormatCard
            title="7Z 格式"
            description="开源高压缩比格式，支持多种压缩算法"
            features={['高压缩比', 'LZMA算法', 'AES-256加密', '大文件支持']}
            support="完全支持"
          />
          <FormatCard
            title="其他格式"
            description="TAR、GZ、BZ2、XZ 等 Unix/Linux 常用格式"
            features={['TAR归档', 'GZIP压缩', 'BZIP2压缩', 'XZ压缩']}
            support="基础支持"
          />
        </div>
      </section>

      {/* 常见问题 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          常见问题
        </h2>
        <div className="space-y-4">
          <FAQItem
            question="文件会上传到服务器吗？"
            answer="不会！ZhugeExtract 完全在您的浏览器本地处理文件，使用 WebAssembly 技术，所有文件都保存在您的设备上，绝不会上传到任何服务器。"
          />
          <FAQItem
            question="支持的最大文件大小是多少？"
            answer="理论上没有固定限制，但受到设备内存的限制。一般来说：桌面设备可以处理 1-2GB 的文件，移动设备建议不超过 500MB。"
          />
          <FAQItem
            question="如何处理密码保护的文件？"
            answer="上传密码保护的压缩文件后，系统会自动检测并提示输入密码。输入正确密码后即可正常浏览和解压文件。"
          />
          <FAQItem
            question="为什么某些文件无法预览？"
            answer="ZhugeExtract 支持预览文本、图片、PDF 等常见格式。对于不支持的格式（如可执行文件、专业软件文件），您可以直接下载到本地使用对应软件打开。"
          />
          <FAQItem
            question="可以在手机上使用吗？"
            answer="可以！ZhugeExtract 支持响应式设计，在手机和平板上都能正常使用。我们还提供了微信小程序版本以获得更好的移动体验。"
          />
          <FAQItem
            question="遇到错误该怎么办？"
            answer="请检查：1) 文件是否损坏；2) 浏览器是否支持（建议使用 Chrome、Firefox、Safari 等现代浏览器）；3) 设备内存是否充足。如问题持续存在，请在 GitHub 上反馈。"
          />
        </div>
      </section>

      {/* 浏览器兼容性 */}
      <section className="card">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            浏览器兼容性
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <BrowserSupport browser="Chrome" version="80+" status="完全支持" />
            <BrowserSupport browser="Firefox" version="78+" status="完全支持" />
            <BrowserSupport browser="Safari" version="14+" status="完全支持" />
            <BrowserSupport browser="Edge" version="80+" status="完全支持" />
          </div>
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>注意：</strong>由于使用了 WebAssembly 和 SharedArrayBuffer 技术，
                  需要现代浏览器支持。建议使用最新版本的浏览器以获得最佳体验。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 移动端使用 */}
      <section className="card">
        <div className="card-body">
          <div className="flex items-center space-x-3 mb-6">
            <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              移动端使用
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                浏览器版本
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 支持触摸操作和手势</li>
                <li>• 响应式界面适配</li>
                <li>• 可安装为 PWA 应用</li>
                <li>• 离线缓存功能</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                微信小程序版本
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 原生体验更流畅</li>
                <li>• 支持微信文件传输</li>
                <li>• 更好的性能优化</li>
                <li>• 即用即走，无需安装</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 安全须知 */}
      <section className="card">
        <div className="card-body">
          <div className="flex items-center space-x-3 mb-6">
            <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              安全须知
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  本地处理保护隐私
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  所有文件处理都在您的设备上完成，不会上传到任何服务器，完全保护您的隐私和数据安全。
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  安全的密码处理
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  密码只在本地内存中短暂存储，用于解压文件，不会被保存或传输。
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  开源透明
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  项目代码完全开源，您可以在 GitHub 上查看所有源码，确保没有恶意行为。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 获取帮助 */}
      <section className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          还有问题？
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          如果您遇到其他问题或有改进建议，欢迎联系我们
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="https://github.com/zhuge-extract/zhuge-extract/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            GitHub Issues
          </a>
          <a
            href="mailto:hello@zhuge-extract.com"
            className="btn btn-secondary"
          >
            发送邮件
          </a>
        </div>
      </section>
    </div>
  )
}

interface QuickStartStepProps {
  icon: React.ReactNode
  step: string
  title: string
  description: string
}

function QuickStartStep({ icon, step, title, description }: QuickStartStepProps) {
  return (
    <div className="text-center">
      <div className="relative mb-4">
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 mx-auto">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {step}
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  )
}

interface FormatCardProps {
  title: string
  description: string
  features: string[]
  support: string
}

function FormatCard({ title, description, features, support }: FormatCardProps) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
            {support}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {description}
        </p>
        <div className="space-y-1">
          {features.map((feature) => (
            <div key={feature} className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface FAQItemProps {
  question: string
  answer: string
}

function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <details className="card group">
      <summary className="card-body cursor-pointer flex items-center justify-between">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 pr-4">
          {question}
        </h3>
        <div className="text-gray-400 group-open:rotate-180 transition-transform duration-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </summary>
      <div className="card-body pt-0">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {answer}
        </p>
      </div>
    </details>
  )
}

interface BrowserSupportProps {
  browser: string
  version: string
  status: string
}

function BrowserSupport({ browser, version, status }: BrowserSupportProps) {
  return (
    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
        {browser}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {version}
      </div>
      <div className="text-xs text-green-600 dark:text-green-400">
        {status}
      </div>
    </div>
  )
}