import React from 'react'
import { Shield, Eye, Lock, Server, Database, UserCheck } from 'lucide-react'

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* 页面标题 */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-xl mb-6 text-green-600 dark:text-green-400">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          隐私政策
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          我们致力于保护您的隐私和数据安全，这里详细说明了我们如何处理您的信息
        </p>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          最后更新时间：2024年8月1日
        </div>
      </div>

      {/* 核心承诺 */}
      <section className="card bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            我们的核心承诺
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl mb-4 text-green-600 dark:text-green-400">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                本地处理
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                所有文件都在您的设备上处理，绝不上传到服务器
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4 text-blue-600 dark:text-blue-400">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                透明开源
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                所有代码开源，您可以审查我们的实现
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl mb-4 text-purple-600 dark:text-purple-400">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                用户控制
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                您完全控制自己的数据，随时可以清理
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 数据收集 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          我们收集什么信息
        </h2>
        
        <div className="space-y-6">
          <DataCollectionItem
            icon={<Server className="w-5 h-5" />}
            title="服务器日志"
            description="我们的静态托管服务（如 GitHub Pages、Vercel）会收集标准的访问日志"
            details={[
              'IP 地址（用于防止滥用）',
              '访问时间和页面路径',
              '浏览器用户代理字符串',
              '引用页面（如果有）'
            ]}
            retention="日志会根据托管服务的政策自动清理，通常为 30-90 天"
          />

          <DataCollectionItem
            icon={<Database className="w-5 h-5" />}
            title="本地存储"
            description="为了提供更好的用户体验，我们在您的设备上存储一些设置信息"
            details={[
              '主题偏好设置（亮色/暗色模式）',
              '语言偏好设置',
              '最近使用的文件信息（仅文件名和大小）',
              '应用设置和偏好'
            ]}
            retention="这些数据存储在您的浏览器中，您可以随时清理"
          />

          <DataCollectionItem
            icon={<Lock className="w-5 h-5" />}
            title="文件处理"
            description="您上传的文件完全在本地处理，我们绝不收集或存储您的文件内容"
            details={[
              '文件只在浏览器内存中临时处理',
              '处理完成后立即从内存中清除',
              '密码只在本地内存中短暂存储',
              '不会创建任何备份或缓存'
            ]}
            retention="文件数据不会被存储，关闭页面后完全清除"
          />
        </div>
      </section>

      {/* 技术实现 */}
      <section className="card">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            技术实现说明
          </h2>
          <div className="space-y-4">
            <TechImplementation
              title="WebAssembly 本地处理"
              description="我们使用 WebAssembly 技术将压缩算法直接运行在您的浏览器中，无需将文件发送到服务器。"
            />
            <TechImplementation
              title="无服务器架构"
              description="应用采用纯静态部署，没有后端服务器，因此在技术上无法收集或存储您的文件。"
            />
            <TechImplementation
              title="内存管理"
              description="文件数据只存在于浏览器的运行时内存中，页面关闭或刷新后会被浏览器自动清理。"
            />
            <TechImplementation
              title="安全传输"
              description="所有网络通信都通过 HTTPS 加密，静态资源通过 CDN 安全分发。"
            />
          </div>
        </div>
      </section>

      {/* 第三方服务 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          第三方服务
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ThirdPartyService
            name="GitHub Pages / Vercel"
            purpose="网站托管"
            dataShared="访问日志（IP、时间、页面）"
            privacy="遵循各自的隐私政策"
          />
          <ThirdPartyService
            name="Google Fonts"
            purpose="字体加载"
            dataShared="字体请求信息"
            privacy="可选择下载到本地避免请求"
          />
        </div>
      </section>

      {/* 用户权利 */}
      <section className="card">
        <div className="card-body">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            您的权利
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                数据控制权
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 随时清理浏览器存储的设置数据</li>
                <li>• 控制哪些文件被处理</li>
                <li>• 选择是否使用外部字体服务</li>
                <li>• 决定是否启用某些功能</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                透明度权利
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• 查看所有开源代码</li>
                <li>• 了解数据处理方式</li>
                <li>• 审核隐私政策变更</li>
                <li>• 获得技术支持和解答</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* GDPR 合规 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          GDPR 合规说明
        </h2>
        <div className="space-y-4">
          <ComplianceItem
            title="合法基础"
            content="我们基于合法利益（提供服务）和用户同意（设置存储）处理数据。"
          />
          <ComplianceItem
            title="数据最小化"
            content="我们只收集提供服务所必需的最少信息，不进行不必要的数据收集。"
          />
          <ComplianceItem
            title="用户权利"
            content="您有权访问、更正、删除个人数据，以及数据可携带权。"
          />
          <ComplianceItem
            title="数据保护"
            content="采用技术和组织措施保护数据安全，包括加密传输和本地处理。"
          />
        </div>
      </section>

      {/* 联系方式 */}
      <section className="card">
        <div className="card-body text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            隐私问题或建议
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            如果您对我们的隐私实践有任何疑问、建议或投诉，请联系我们
          </p>
          <div className="space-y-4">
            <div>
              <strong className="text-gray-900 dark:text-gray-100">邮箱：</strong>
              <a
                href="mailto:privacy@zhuge-extract.com"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 ml-2"
              >
                privacy@zhuge-extract.com
              </a>
            </div>
            <div>
              <strong className="text-gray-900 dark:text-gray-100">GitHub：</strong>
              <a
                href="https://github.com/zhuge-extract/zhuge-extract/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 ml-2"
              >
                提交 Issue
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 政策更新 */}
      <section className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          政策更新
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          我们可能会不时更新本隐私政策。重大变更会通过网站公告或其他适当方式通知用户。
          建议您定期查看本页面以了解最新的隐私实践。继续使用我们的服务即表示您接受更新后的政策。
        </p>
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          版本：v1.0 | 生效日期：2024年8月1日
        </div>
      </section>
    </div>
  )
}

interface DataCollectionItemProps {
  icon: React.ReactNode
  title: string
  description: string
  details: string[]
  retention: string
}

function DataCollectionItem({ icon, title, description, details, retention }: DataCollectionItemProps) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {description}
            </p>
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                具体信息：
              </h4>
              <ul className="space-y-1">
                {details.map((detail, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <strong>保留期限：</strong>{retention}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TechImplementationProps {
  title: string
  description: string
}

function TechImplementation({ title, description }: TechImplementationProps) {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  )
}

interface ThirdPartyServiceProps {
  name: string
  purpose: string
  dataShared: string
  privacy: string
}

function ThirdPartyService({ name, purpose, dataShared, privacy }: ThirdPartyServiceProps) {
  return (
    <div className="card">
      <div className="card-body">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {name}
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">用途：</span>
            <span className="text-gray-600 dark:text-gray-400">{purpose}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">共享数据：</span>
            <span className="text-gray-600 dark:text-gray-400">{dataShared}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">隐私保护：</span>
            <span className="text-gray-600 dark:text-gray-400">{privacy}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ComplianceItemProps {
  title: string
  content: string
}

function ComplianceItem({ title, content }: ComplianceItemProps) {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {content}
        </p>
      </div>
    </div>
  )
}