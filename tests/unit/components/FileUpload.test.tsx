import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '@/components/FileUpload';

// Mock file reader
const mockFileReader = {
  readAsArrayBuffer: vi.fn(),
  result: null,
  onload: null,
  onerror: null
};

Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockFileReader)
});

describe('FileUpload', () => {
  const mockOnFileDrop = vi.fn();
  const mockOnError = vi.fn();
  
  const defaultProps = {
    onFileDrop: mockOnFileDrop,
    onError: mockOnError,
    acceptedTypes: ['application/zip', 'application/x-rar-compressed'],
    maxFileSize: 1024 * 1024, // 1MB for test efficiency
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('渲染', () => {
    it('应该渲染上传区域', () => {
      render(<FileUpload {...defaultProps} />);
      
      expect(screen.getByTestId('file-upload-zone')).toBeInTheDocument();
      expect(screen.getByText(/拖拽文件到此处/)).toBeInTheDocument();
      expect(screen.getByText(/或点击选择文件/)).toBeInTheDocument();
    });

    it('应该显示支持的文件类型', () => {
      render(<FileUpload {...defaultProps} />);
      
      expect(screen.getByText(/支持格式/)).toBeInTheDocument();
      expect(screen.getByText(/ZIP, RAR/)).toBeInTheDocument();
    });

    it('应该显示文件大小限制', () => {
      render(<FileUpload {...defaultProps} />);
      
      expect(screen.getByText(/最大100MB/)).toBeInTheDocument();
    });

    it('应该在没有props时使用默认值', () => {
      render(<FileUpload onFileDrop={mockOnFileDrop} />);
      
      expect(screen.getByTestId('file-upload-zone')).toBeInTheDocument();
    });
  });

  describe('文件拖拽', () => {
    it('应该处理文件拖拽进入', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      
      fireEvent.dragEnter(dropZone);
      
      expect(dropZone).toHaveClass('drag-over');
      expect(screen.getByText(/释放文件/)).toBeInTheDocument();
    });

    it('应该处理文件拖拽离开', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      
      fireEvent.dragEnter(dropZone);
      fireEvent.dragLeave(dropZone);
      
      expect(dropZone).not.toHaveClass('drag-over');
    });

    it('应该处理文件拖拽悬停', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      
      const dragOverEvent = new Event('dragover', { bubbles: true });
      Object.defineProperty(dragOverEvent, 'preventDefault', {
        value: vi.fn()
      });
      
      fireEvent(dropZone, dragOverEvent);
      
      expect(dragOverEvent.preventDefault).toHaveBeenCalled();
    });

    it('应该处理有效文件拖拽放下', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      const file = new File(['zip content'], 'test.zip', { 
        type: 'application/zip' 
      });
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      });
      
      await waitFor(() => {
        expect(mockOnFileDrop).toHaveBeenCalledWith(file);
      });
      
      expect(dropZone).not.toHaveClass('drag-over');
    });

    it('应该拒绝无效文件类型', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      const invalidFile = new File(['text content'], 'test.txt', { 
        type: 'text/plain' 
      });
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [invalidFile]
        }
      });
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('不支持的文件类型')
          })
        );
      });
      
      expect(mockOnFileDrop).not.toHaveBeenCalled();
    });

    it('应该拒绝过大文件', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      
      // 创建一个超过限制的大文件
      const largeContent = new Array(101 * 1024 * 1024).fill('a').join('');
      const largeFile = new File([largeContent], 'large.zip', { 
        type: 'application/zip' 
      });
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [largeFile]
        }
      });
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('文件过大')
          })
        );
      });
      
      expect(mockOnFileDrop).not.toHaveBeenCalled();
    });

    it('应该处理多个文件（只取第一个）', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      const file1 = new File(['content1'], 'test1.zip', { type: 'application/zip' });
      const file2 = new File(['content2'], 'test2.zip', { type: 'application/zip' });
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file1, file2]
        }
      });
      
      await waitFor(() => {
        expect(mockOnFileDrop).toHaveBeenCalledWith(file1);
      });
    });
  });

  describe('文件选择', () => {
    it('应该通过点击选择文件', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const file = new File(['content'], 'test.zip', { type: 'application/zip' });
      
      await user.upload(fileInput, file);
      
      expect(fileInput.files![0]).toBe(file);
      expect(mockOnFileDrop).toHaveBeenCalledWith(file);
    });

    it('应该触发文件输入点击', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      
      const clickSpy = vi.spyOn(fileInput, 'click');
      
      await user.click(dropZone);
      
      expect(clickSpy).toHaveBeenCalled();
    });

    it('应该验证通过输入选择的文件', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      await user.upload(fileInput, invalidFile);
      
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('不支持的文件类型')
        })
      );
    });
  });

  describe('加载状态', () => {
    it('应该显示加载状态', () => {
      render(<FileUpload {...defaultProps} loading={true} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/正在处理/)).toBeInTheDocument();
      
      const dropZone = screen.getByTestId('file-upload-zone');
      expect(dropZone).toHaveClass('loading');
    });

    it('应该在加载时禁用交互', () => {
      render(<FileUpload {...defaultProps} loading={true} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      
      expect(fileInput).toBeDisabled();
      
      // 尝试拖拽文件
      const file = new File(['content'], 'test.zip', { type: 'application/zip' });
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] }
      });
      
      expect(mockOnFileDrop).not.toHaveBeenCalled();
    });
  });

  describe('错误状态', () => {
    it('应该显示错误信息', () => {
      const errorMessage = '文件解析失败';
      render(<FileUpload {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      
      const dropZone = screen.getByTestId('file-upload-zone');
      expect(dropZone).toHaveClass('error');
    });

    it('应该允许清除错误', async () => {
      const user = userEvent.setup();
      const mockOnClearError = vi.fn();
      
      render(
        <FileUpload 
          {...defaultProps} 
          error="错误信息" 
          onClearError={mockOnClearError}
        />
      );
      
      const clearButton = screen.getByTestId('clear-error-button');
      await user.click(clearButton);
      
      expect(mockOnClearError).toHaveBeenCalled();
    });
  });

  describe('自定义配置', () => {
    it('应该支持自定义接受的文件类型', () => {
      const customProps = {
        ...defaultProps,
        acceptedTypes: ['application/x-7z-compressed'],
        acceptedExtensions: ['7z']
      };
      
      render(<FileUpload {...customProps} />);
      
      expect(screen.getByText(/7Z/)).toBeInTheDocument();
    });

    it('应该支持自定义最大文件大小', () => {
      const customProps = {
        ...defaultProps,
        maxFileSize: 50 * 1024 * 1024 // 50MB
      };
      
      render(<FileUpload {...customProps} />);
      
      expect(screen.getByText(/最大50MB/)).toBeInTheDocument();
    });

    it('应该支持自定义文案', () => {
      const customProps = {
        ...defaultProps,
        title: '自定义标题',
        subtitle: '自定义副标题',
        dragActiveText: '自定义拖拽文案'
      };
      
      render(<FileUpload {...customProps} />);
      
      expect(screen.getByText('自定义标题')).toBeInTheDocument();
      expect(screen.getByText('自定义副标题')).toBeInTheDocument();
      
      // 测试拖拽状态文案
      const dropZone = screen.getByTestId('file-upload-zone');
      fireEvent.dragEnter(dropZone);
      
      expect(screen.getByText('自定义拖拽文案')).toBeInTheDocument();
    });
  });

  describe('键盘访问性', () => {
    it('应该支持键盘导航', async () => {
      const user = userEvent.setup();
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      
      // Tab到组件
      await user.tab();
      expect(dropZone).toHaveFocus();
      
      // 按Enter键触发文件选择
      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');
      
      await user.keyboard('{Enter}');
      expect(clickSpy).toHaveBeenCalled();
    });

    it('应该有正确的ARIA属性', () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      
      expect(dropZone).toHaveAttribute('role', 'button');
      expect(dropZone).toHaveAttribute('tabIndex', '0');
      expect(dropZone).toHaveAttribute('aria-label', expect.stringContaining('选择文件'));
    });

    it('应该在错误状态下有正确的ARIA属性', () => {
      render(<FileUpload {...defaultProps} error="错误信息" />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      const errorMessage = screen.getByTestId('error-message');
      
      expect(dropZone).toHaveAttribute('aria-describedby', errorMessage.id);
      expect(dropZone).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('性能测试', () => {
    it('应该高效处理大量拖拽事件', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      const startTime = performance.now();
      
      // 模拟快速拖拽事件
      for (let i = 0; i < 100; i++) {
        fireEvent.dragEnter(dropZone);
        fireEvent.dragLeave(dropZone);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // 应该在100ms内完成
    });

    it('应该防抖多次文件拖拽', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      const file = new File(['content'], 'test.zip', { type: 'application/zip' });
      
      // 快速多次拖拽
      for (let i = 0; i < 5; i++) {
        fireEvent.drop(dropZone, {
          dataTransfer: { files: [file] }
        });
      }
      
      await waitFor(() => {
        expect(mockOnFileDrop).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('边界情况', () => {
    it('应该处理空文件列表', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [] }
      });
      
      expect(mockOnFileDrop).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('应该处理null dataTransfer', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      
      fireEvent.drop(dropZone, {
        dataTransfer: null
      });
      
      expect(mockOnFileDrop).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('应该处理文件名包含特殊字符', async () => {
      render(<FileUpload {...defaultProps} />);
      
      const dropZone = screen.getByTestId('file-upload-zone');
      const file = new File(['content'], '测试文件 (1) [copy].zip', { 
        type: 'application/zip' 
      });
      
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] }
      });
      
      await waitFor(() => {
        expect(mockOnFileDrop).toHaveBeenCalledWith(file);
      });
    });
  });
});