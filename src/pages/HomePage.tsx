import React from 'react'
import { FileArchive, Shield, Zap, Globe } from 'lucide-react'
import { useArchiveState } from '@/contexts/ArchiveContext'
import { FileUpload } from '@/components/ui'

export function HomePage() {
  const { currentArchive } = useArchiveState()

  // 如果有当前压缩包，显示工作区界面
  if (currentArchive) {
    return <WorkspaceView />
  }

  // 否则显示欢迎界面
  return <WelcomeView />
}

function WelcomeView() {
  return (
    <div className="space-y-16">
      {/* Hero区域 */}
      <div className="text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-strong mb-6">
            <FileArchive className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            <span className="gradient-text">ZhugeExtract</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            基于诸葛亮智慧的在线解压工具，支持多种格式，完全本地处理，保护您的隐私
          </p>
        </div>

        <FileUpload />
      </div>

      {/* 特性介绍 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard
          icon={<Shield className="w-8 h-8" />}
          title="隐私保护"
          description="所有文件在本地处理，不上传到服务器，完全保护您的隐私和数据安全"
        />
        <FeatureCard
          icon={<Zap className="w-8 h-8" />}
          title="快速处理"
          description="基于WebAssembly技术，提供媲美桌面软件的解压速度和性能"
        />
        <FeatureCard
          icon={<Globe className="w-8 h-8" />}
          title="多格式支持"
          description="支持ZIP、RAR、7Z、TAR、GZ等主流压缩格式，满足各种使用需求"
        />
      </div>

      {/* 支持的格式 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          支持的格式
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {['ZIP', 'RAR', '7Z', 'TAR', 'GZ', 'BZ2', 'XZ'].map((format) => (
            <div
              key={format}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {format}
            </div>
          ))}
        </div>
      </div>

      {/* 使用步骤 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          简单三步，轻松解压
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StepCard
            step="1"
            title="上传文件"
            description="拖拽或点击上传您的压缩文件"
          />
          <StepCard
            step="2"
            title="浏览内容"
            description="查看压缩包内的文件结构"
          />
          <StepCard
            step="3"
            title="预览下载"
            description="预览文件内容或下载到本地"
          />
        </div>
      </div>
    </div>
  )
}

function WorkspaceView() {
  return (
    <div className="text-center text-gray-600 dark:text-gray-400">
      <p>工作区内容将由MainLayout处理</p>
    </div>
  )
}


interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-xl mb-6 text-primary-600 dark:text-primary-400">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  )
}

interface StepCardProps {
  step: string
  title: string
  description: string
}

function StepCard({ step, title, description }: StepCardProps) {
  return (
    <div className="relative">
      <div className="flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full text-lg font-bold mx-auto mb-4">
        {step}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  )
}